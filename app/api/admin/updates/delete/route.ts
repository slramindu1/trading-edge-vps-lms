import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/getServerSession";

const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL || "ramindu.jiat@gmail.com";
const GITHUB_TOKEN = process.env.GITHUB_UPDATE_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_UPDATE_REPO!;
const GITHUB_BRANCH = process.env.GITHUB_UPDATE_BRANCH || "main";

async function fetchGitHub(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "trading-edge-lms",
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`GitHub API error (${endpoint}):`, res.status, text);
    throw new Error(`GitHub API error: ${res.status}`);
  }
  
  return res.status === 204 ? null : await res.json();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.email !== MASTER_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get current branch ref to find latest commit
    let commitSha;
    try {
      const refData = await fetchGitHub(`/git/refs/heads/${GITHUB_BRANCH}`);
      commitSha = refData.object.sha;
    } catch {
      return NextResponse.json({ error: "Could not find branch." }, { status: 500 });
    }

    // 2. Get the commit to find base tree
    const commitData = await fetchGitHub(`/git/commits/${commitSha}`);
    const baseTreeSha = commitData.tree.sha;

    // Fetch existing manifest
    let manifest: { updates: any[] } = { updates: [] };
    try {
      const existingManifestUrl = `/contents/manifest.json?ref=${GITHUB_BRANCH}`;
      const manifestRes = await fetchGitHub(existingManifestUrl);
      manifest = JSON.parse(Buffer.from(manifestRes.content, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ error: "Manifest not found on GitHub." }, { status: 404 });
    }

    // Update manifest by removing the target update
    const initialCount = manifest.updates.length;
    manifest.updates = manifest.updates.filter((u: any) => u.id !== id);

    if (manifest.updates.length === initialCount) {
      return NextResponse.json({ error: "Update not found in manifest." }, { status: 404 });
    }

    const tree = [
      {
        path: "manifest.json",
        mode: "100644",
        type: "blob",
        content: JSON.stringify(manifest, null, 2),
      }
    ];

    // 4. Create Tree
    const newTreeData = await fetchGitHub(`/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    });

    // 5. Create Commit
    const newCommitData = await fetchGitHub(`/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Delete update: ${id}`,
        tree: newTreeData.sha,
        parents: [commitSha],
      }),
    });

    // 6. Update Ref
    await fetchGitHub(`/git/refs/heads/${GITHUB_BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false,
      }),
    });

    return NextResponse.json({ success: true, message: `Update deleted successfully!` });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Delete error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
