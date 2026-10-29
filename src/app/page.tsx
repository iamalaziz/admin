// Next Imports
import { redirect } from 'next/navigation'

// Config Imports
import themeConfig from '@/configs/themeConfig'

const Page = () => {
  redirect(themeConfig.homePageUrl)
}

export default Page
