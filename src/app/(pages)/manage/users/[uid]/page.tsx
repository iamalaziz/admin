// Component Imports
import { UserDetail } from '@/views/wordzen/users/user-detail'

export const metadata = {
  title: 'User | WordZen Admin'
}

const UserPage = async ({ params }: { params: Promise<{ uid: string }> }) => {
  const { uid } = await params

  return <UserDetail uid={uid} />
}

export default UserPage
