import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { LessonsManager } from "@/components/admin/LessonsManager";
import { CoursesManager } from "@/components/admin/CoursesManager";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { listQuery, pageWindow, type SearchValues } from "@/lib/admin/list-query";
import { AdminListControls } from "@/components/admin/AdminListControls";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Nội Dung Khóa Học & Video Bài Giảng",
    description: "Quản lý bài giảng video, gắn link YouTube/Vimeo, tổ chức học phần và phân quyền học viên Free hoặc VIP.",
};
export default async function AdminLessons({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    await requireAdmin();
    const values = await searchParams, query = listQuery(values);
    const vip = query.choice("vip", ["all", "vip", "free"], "all"), status = query.choice("status", ["all", "DRAFT", "PUBLISHED", "HIDDEN"], "all"), sort = query.choice("sort", ["order", "newest", "title"], "order");
    const courseId = query.value("courseId"), moduleName = query.value("module");
    const where: Prisma.LessonWhereInput = { ...(courseId && { courseId }), ...(moduleName && { moduleName }), ...(vip !== "all" && { isVIP: vip === "vip" }), ...(status !== "all" && { status: status as "DRAFT" | "PUBLISHED" | "HIDDEN" }), ...(query.q && { OR: [{ title: { contains: query.q, mode: "insensitive" } }, { course: { title: { contains: query.q, mode: "insensitive" } } }] }) };
    const window = pageWindow(await prisma.lesson.count({ where }), query.page, query.size);
    const [lessons, courses] = await Promise.all([
        prisma.lesson.findMany({
            where, skip: window.skip, take: window.size,
            orderBy: sort === "newest" ? [{ createdAt: "desc" }, { id: "asc" }] : sort === "title" ? [{ title: "asc" }, { id: "asc" }] : [{ courseId: "asc" }, { order: "asc" }, { id: "asc" }],
            include: {
                course: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma.course.findMany({
            select: { id: true, title: true, description: true, thumbnail: true, status: true, _count: { select: { lessons: true } } },
            orderBy: { createdAt: "asc" },
        }),
    ]);
    const modules = await prisma.lesson.findMany({ where: courseId ? { courseId } : {}, distinct: ["moduleName"], select: { moduleName: true }, orderBy: { moduleName: "asc" }, take: 1000 });
    const courseOrders = await prisma.lesson.groupBy({ by: ["courseId"], _max: { order: true } });
    const serializedLessons = lessons.map((l) => ({
        ...l,
        createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
    }));
    const listControls = <AdminListControls embedded path="/admin/lessons" values={values} window={window} filters={[
            { name: "courseId", label: "Khóa học", options: [{ value: "", label: "Tất cả" }, ...courses.map(course => ({ value: course.id, label: course.title }))] },
            { name: "module", label: "Phần học", options: [{ value: "", label: "Tất cả" }, ...modules.map(module => ({ value: module.moduleName, label: module.moduleName }))] },
            { name: "vip", label: "Quyền", options: [{ value: "all", label: "Tất cả" }, { value: "vip", label: "VIP" }, { value: "free", label: "Free" }] },
            { name: "status", label: "Xuất bản", options: [{ value: "all", label: "Tất cả" }, { value: "DRAFT", label: "Nháp" }, { value: "PUBLISHED", label: "Đã xuất bản" }, { value: "HIDDEN", label: "Đã ẩn" }] },
            { name: "sort", label: "Sắp xếp", options: [{ value: "order", label: "Thứ tự bài" }, { value: "newest", label: "Mới nhất" }, { value: "title", label: "Tên bài A–Z" }] }
        ]}/>;
    return (<div className="flex-1 flex flex-col min-h-0 gap-4">
      <CoursesManager courses={courses.map(course => ({ ...course, lessonsCount: course._count.lessons }))}/>
      <LessonsManager listControls={listControls} initialLessons={serializedLessons} courses={courses.map(course => ({ ...course, maxOrder: courseOrders.find(row => row.courseId === course.id)?._max.order ?? 0 }))}/>
    </div>);
}
