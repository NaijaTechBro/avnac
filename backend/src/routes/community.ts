import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
import { auth } from "../auth"; 
import { db } from "../db";
import { template, plugin } from "../db/schema";
import { HttpError } from "../lib/http";

export const communityRoutes = new Elysia({ prefix: "/community" })
  .get("/templates", async () => {
    const templates = await db
      .select()
      .from(template)
      .where(eq(template.isPublic, true))
      .orderBy(desc(template.createdAt))
      .limit(50);

    return { data: templates };
  })

  .post(
    "/templates",
    async ({ request, body, set }) => {
      const authSession = await auth.api.getSession({
        headers: request.headers,
      });

      try {
        const inserted = await db
          .insert(template)
          .values({
            ownerUserId: authSession?.user.id ?? null, 
            title: body.title,
            thumbnailUrl: body.thumbnailUrl,
            document: body.document,
            isPublic: true,
          })
          .returning();

        set.status = 201; 
        return { data: inserted[0] };
      } catch (err) {
        console.error(err);
        throw new HttpError(500, "Failed to publish template");
      }
    },
    {
      body: t.Object({
        title: t.String(),
        thumbnailUrl: t.String(),
        document: t.Any(),
      }),
    }
  )

  .get("/plugins", async () => {
    const plugins = await db
      .select()
      .from(plugin)
      .where(eq(plugin.isApproved, true))
      .orderBy(desc(plugin.createdAt));

    return { data: plugins };
  });