// Component Imports
import { ModuleDetail } from '@/views/wordzen/modules/module-detail'

export const metadata = {
  title: 'Module | WordZen Admin'
}

const ModulePage = async ({ params }: { params: Promise<{ moduleId: string }> }) => {
  const { moduleId } = await params

  return <ModuleDetail moduleId={Number(moduleId)} />
}

export default ModulePage
