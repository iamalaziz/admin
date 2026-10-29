// Component Imports
import { CourseDetail } from '@/views/wordzen/courses/course-detail'

export const metadata = {
  title: 'Course | WordZen Admin'
}

// Next 15+ hands route params to the page as a promise.
const CoursePage = async ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = await params

  return <CourseDetail courseId={Number(courseId)} />
}

export default CoursePage
