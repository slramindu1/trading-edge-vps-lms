import { adminGetCourse } from "@/app/data/admin-get-course";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCourseForm } from "./_components/EditCourseForm";
import { SubTopicStrucutre } from "./_components/SubTopicStrucutre";

type Params = Promise<{ courseId: string }>;

export default async function EditRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  const data = await adminGetCourse(courseId);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Edit Topic:{" "}
        <span className="text-primary underline">{data.title}</span>
      </h1>

      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="course-structure">Course Structure</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
                <CardTitle>
                    Basic Info
                </CardTitle>
                <CardDescription>
                    Edit Basic Information about the topic
                </CardDescription>
            </CardHeader>
            <CardContent>
                <EditCourseForm data={data}/>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="course-structure">
          <Card>
            <CardHeader>
                <CardTitle>
                    Course Structure
                </CardTitle>
                <CardDescription>
                    Here you can update your mentorship structure
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SubTopicStrucutre data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
