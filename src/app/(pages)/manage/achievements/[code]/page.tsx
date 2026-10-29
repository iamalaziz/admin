// Component Imports
import { AchievementDetail } from '@/views/wordzen/achievements/achievement-detail'

export const metadata = {
  title: 'Achievement | WordZen Admin'
}

// Next 15+ hands route params to the page as a promise.
const AchievementPage = async ({ params }: { params: Promise<{ code: string }> }) => {
  const { code } = await params

  return <AchievementDetail code={code} />
}

export default AchievementPage
