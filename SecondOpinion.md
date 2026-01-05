Yep — the **403 is the whole reason** your UI keeps generating a new slug on every Publish click.

And the **403 is happening because your ownership check is comparing two different kinds of IDs**.

---

## What’s the issue (simple + exact)

### In your schema

* `PublishedPage.userId` = **Clerk user id** (external) ✅
* `User.clerkId` = **Clerk user id** ✅
* `User.id` = **your internal DB user id** (cuid) ✅
* `Project.userId` = **your internal DB user id** (references `User.id`) ✅

So:

### In your endpoint

You do:

```ts
const { userId } = await auth(); // Clerk userId (external)
...
select: { id: true, userId: true } // Project.userId = internal User.id
...
if (project.userId !== userId) return 403;
```

That comparison will **always fail**, because:

* `project.userId` looks like: `ckx...` (cuid)
* `userId` looks like: `user_2abc...` (Clerk id)

✅ Result: endpoint always returns **403 Forbidden** even for the owner.

That means your preview page never receives the existing published slug, so it falls back to generating a new slug from headline every click.

---

## Why your other endpoint “works” without auth

`src/app/api/projects/[tokenId]/route.ts` has **no auth check** at all, so it can return the project fine. But it also doesn’t help with “published slug”, because the published slug lives in `PublishedPage`.

---

## Fix options (pick one)

### ✅ Fix A (recommended): verify ownership via the `User` relation (`User.clerkId`)

Change your project query to check the related user’s `clerkId`:

```ts
const project = await prisma.project.findUnique({
  where: { tokenId },
  select: {
    id: true,
    user: { select: { clerkId: true } },
  },
});

if (!project) return 404;

if (project.user?.clerkId !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

This matches:

* `project.user.clerkId` (Clerk id) ✅
  with
* `auth().userId` (Clerk id) ✅

You can even do it in one go by filtering:

```ts
const project = await prisma.project.findFirst({
  where: {
    tokenId,
    user: { clerkId: userId },
  },
  select: { id: true },
});

if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

(If you want to distinguish “not found” vs “forbidden”, do a second lookup.)

---

### Fix B: store Clerk id on Project (not necessary right now)

Add `clerkUserId` to Project and compare directly. This is a schema change, so only do it if you want to simplify future authorization.

---

## One more thing (secondary cause of “new slug every click”)

Even after fixing 403, you might still see slug changes if your preview page’s slug generation falls back to `page-${Date.now()}` because headline content isn’t a string.

From the file you uploaded earlier, your code does:

* if headline is not a string → `headlineText = ''`
* then it uses `page-${Date.now()}` → new every click

So after fixing 403, also make sure headline extraction is stable (e.g., use `project.title` or extract text from your rich JSON).

But **your current main blocker is definitely the 403 ownership mismatch**.

---