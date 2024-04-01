import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "@kenkun/zod_valdv3";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.get("/simp", (c) => {
    return c.text("ANIME!");
})

userRouter.post("/signup", async (c) => {
    const body = await c.req.json();
    console.log(body);

    const { success } = signupInput.safeParse(body);
    console.log(success);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Incorrect inputs"
        })
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const user = await prisma.user.create({
            data: {
                username: body.username,
                password: body.password,
                name: body.name
            }
        })

        const jwt = await sign({
            id: user.id
        }, c.env.JWT_SECRET);

        return c.text(jwt);               // currently returning the token as text

    } catch (error) {
        console.log(error);
        c.status(411);
        return c.text("Invalid inputs");
    }

})

userRouter.post("/signin", async (c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    
    if (!success) {
        c.status(401);
        return c.json({
            message: "Invalid credentials"
        });
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: body.username,
                password: body.password,
            }
        })

        if (!user) {
            c.status(403);
            return c.json({
                message: "No users found"
            });
        }

        const jwt = await sign({
            id: user.id
        }, c.env.JWT_SECRET);

        return c.text(jwt);

    } catch (error) {
        console.log(error);
        c.status(411);
        return c.text("Invalid");
    }
    
});
