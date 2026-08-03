"""EkHub desktop bootstrap.

Makes the native desktop apps self-hosted instead of pointing at the hosted
site. On first launch (and again if things are missing) it:

  1. ensures a Node.js runtime — uses one already on PATH, otherwise downloads
     a private copy into the per-user data dir
  2. fetches the EkHub source (git clone when git exists, else a codeload
     tarball of main)
  3. npm installs and builds the production bundle (dist/)
  4. starts server.mjs on localhost and returns the URL

Subsequent launches are fast: the runtime, source, and node_modules are reused
and only the Vite build is re-run.
"""

import os
import platform
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
import zipfile

NODE_VERSION = os.environ.get("EKHUB_NODE_VERSION", "v24.18.1")
REPO_URL = "https://github.com/shirushimori/EkHub.git"
TARBALL_URL = "https://codeload.github.com/shirushimori/EkHub/tar.gz/refs/heads/main"
SERVER_SCRIPT = "server.mjs"
DEFAULT_PORT = int(os.environ.get("EKHUB_PORT", "43210"))

_DL_UA = {"User-Agent": "Mozilla/5.0 (EkHub native app)"}


def data_dir():
    override = os.environ.get("EKHUB_DATA")
    if override:
        return os.path.abspath(override)
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.path.expanduser("~")
        return os.path.join(base, "EkHub")
    return os.path.join(os.path.expanduser("~"), ".local", "share", "ekhub")


def node_dir():
    return os.path.join(data_dir(), "node")


def repo_dir():
    return os.path.join(data_dir(), "source")


def log(msg):
    print(f"[ekhub] {msg}", flush=True)


def _download(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tmp = dest + ".part"
    req = urllib.request.Request(url, headers=_DL_UA)
    with urllib.request.urlopen(req, timeout=240) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f)
    os.replace(tmp, dest)


def _node_download_url():
    arch = {"x86_64": "x64", "amd64": "x64", "aarch64": "arm64", "arm64": "arm64"}.get(
        platform.machine().lower(), "x64"
    )
    if sys.platform == "win32":
        return f"https://nodejs.org/dist/{NODE_VERSION}/node-{NODE_VERSION}-win-{arch}.zip", "zip"
    return f"https://nodejs.org/dist/{NODE_VERSION}/node-{NODE_VERSION}-linux-{arch}.tar.xz", "tar"


def _extract(archive, dest):
    os.makedirs(dest, exist_ok=True)
    if archive.endswith(".zip"):
        with zipfile.ZipFile(archive) as z:
            z.extractall(dest)
    else:
        with tarfile.open(archive, "r:*") as t:
            t.extractall(dest)


def ensure_node():
    """Return {"node": [cmd...], "npm": [cmd...]} for a working runtime."""
    node = shutil.which("node")
    npm = shutil.which("npm")
    if node and npm:
        log(f"using system Node.js at {node}")
        return {"node": [node], "npm": [npm]}

    ndir = node_dir()
    marker = os.path.join(ndir, "ready")
    if not os.path.exists(marker):
        url, kind = _node_download_url()
        log(f"downloading Node.js {NODE_VERSION}...")
        ext = ".zip" if kind == "zip" else ".tar.xz"
        archive = os.path.join(ndir, "node-download" + ext)
        _download(url, archive)
        _extract(archive, ndir)
        os.remove(archive)
        open(marker, "w").close()

    root = next((os.path.join(ndir, e) for e in os.listdir(ndir) if e.startswith("node-")), None)
    if not root:
        raise RuntimeError("Node.js download did not extract correctly")

    if sys.platform == "win32":
        node_exe = os.path.join(root, "node.exe")
        npm_cli = os.path.join(root, "node_modules", "npm", "bin", "npm-cli.js")
    else:
        node_exe = os.path.join(root, "bin", "node")
        npm_cli = os.path.join(root, "lib", "node_modules", "npm", "bin", "npm-cli.js")
    log(f"using bundled Node.js at {node_exe}")
    return {"node": [node_exe], "npm": [node_exe, npm_cli]}


def ensure_source(runtime=None):
    """Fetch/refresh the EkHub source; return its path."""
    rdir = repo_dir()
    if os.path.isfile(os.path.join(rdir, "package.json")) and os.path.isfile(
        os.path.join(rdir, SERVER_SCRIPT)
    ):
        git = shutil.which("git")
        if git and os.path.isdir(os.path.join(rdir, ".git")):
            log("updating source...")
            subprocess.run([git, "-C", rdir, "pull", "--ff-only"], capture_output=True, text=True)
        return rdir

    parent = os.path.dirname(rdir)
    os.makedirs(parent, exist_ok=True)
    git = shutil.which("git")
    if git:
        log("cloning source...")
        if os.path.isdir(rdir):
            shutil.rmtree(rdir)
        subprocess.run([git, "clone", "--depth", "1", REPO_URL, rdir], check=True)
    else:
        log("downloading source...")
        tgz = os.path.join(parent, "source.tar.gz")
        _download(TARBALL_URL, tgz)
        with tarfile.open(tgz, "r:*") as t:
            members = t.getmembers()
            root_name = members[0].name.split("/")[0] if members else "ekhub-main"
            t.extractall(parent)
        os.remove(tgz)
        extracted = os.path.join(parent, root_name)
        if os.path.isdir(rdir):
            shutil.rmtree(rdir)
        os.replace(extracted, rdir)
    return rdir


def _env_for(runtime):
    env = os.environ.copy()
    env["PATH"] = os.path.dirname(runtime["node"][0]) + os.pathsep + env.get("PATH", "")
    return env


def build_app(runtime, rdir):
    env = _env_for(runtime)

    if not os.path.isdir(os.path.join(rdir, "node_modules")):
        log("installing dependencies...")
        lock = os.path.isfile(os.path.join(rdir, "package-lock.json"))
        cmd = ["ci"] if lock else ["install"]
        r = subprocess.run(runtime["npm"] + cmd, cwd=rdir, env=env, capture_output=True, text=True)
        if r.returncode != 0:
            r = subprocess.run(
                runtime["npm"] + ["install"], cwd=rdir, env=env, capture_output=True, text=True
            )
            if r.returncode != 0:
                raise RuntimeError(f"npm install failed:\n{r.stdout[-1000:]}\n{r.stderr[-1000:]}")

    log("building app...")
    r = subprocess.run(runtime["npm"] + ["run", "build"], cwd=rdir, env=env, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"build failed:\n{r.stdout[-1000:]}\n{r.stderr[-1000:]}")


def start_server(runtime, rdir, port=None):
    port = port or DEFAULT_PORT
    env = _env_for(runtime)
    env["EKHUB_PORT"] = str(port)
    proc = subprocess.Popen(
        runtime["node"] + [os.path.join(rdir, SERVER_SCRIPT)],
        cwd=rdir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    url = f"http://localhost:{port}"
    deadline = time.time() + 60
    while time.time() < deadline:
        if proc.poll() is not None:
            out = proc.stdout.read() if proc.stdout else ""
            raise RuntimeError(f"server exited early:\n{out[-500:]}")
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    log(f"server ready at {url}")
                    return proc, url
        except Exception:
            pass
        time.sleep(0.4)
    raise RuntimeError("server did not become ready in time")


def launch(port=None):
    """Full bootstrap: returns (server_process, url)."""
    runtime = ensure_node()
    rdir = ensure_source(runtime)
    build_app(runtime, rdir)
    return start_server(runtime, rdir, port=port)
