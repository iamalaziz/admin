// Component Imports
import { PaymentDetail } from '@/views/wordzen/payments/payment-detail'

export const metadata = {
  title: 'Payment | WordZen Admin'
}

const PaymentPage = async ({ params }: { params: Promise<{ uid: string }> }) => {
  const { uid } = await params

  return <PaymentDetail uid={uid} />
}

export default PaymentPage
