import { prisma } from "@/lib/prisma";

export async function getAllCourses(){
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const data = await prisma.section.findMany({
        where:{
            status:"Published",
        },
        orderBy:{
            dateCreated:"desc"
        },
        select:{
            title:true,
            smallDescription:true,
            slug:true,
            fileKey:true,
            
        }
    })
    return data
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];