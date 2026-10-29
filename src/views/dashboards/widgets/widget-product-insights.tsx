'use client'

// Third-party Imports
import { Bar, BarChart } from 'recharts'

// Component Imports
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

// Product reached data
const productReachChartData = [
  { month: 'january', reached: 168 },
  { month: 'february', reached: 305 },
  { month: 'march', reached: 213 },
  { month: 'april', reached: 330 },
  { month: 'may', reached: 305 }
]

// Order placed data
const orderPlacedChartData = [
  { month: 'january', orders: 168 },
  { month: 'february', orders: 305 },
  { month: 'march', orders: 213 },
  { month: 'april', orders: 330 },
  { month: 'may', orders: 305 }
]

const ProductInsightsCard = ({ className }: { className?: string }) => {
  const { t } = useTranslation()

  const productReachChartConfig = {
    reached: {
      label: t('dashboard.productInsights.reached'),
      color: 'var(--primary)'
    }
  } satisfies ChartConfig

  const orderPlacedChartConfig = {
    orders: {
      label: t('dashboard.productInsights.orders'),
      color: 'color-mix(in oklab, var(--primary) 10%, transparent)'
    }
  } satisfies ChartConfig

  return (
    <Card className={className}>
      <CardHeader className='flex justify-between'>
        <div className='flex flex-col gap-1'>
          <span className='text-lg font-semibold'>{t('dashboard.productInsights.title')}</span>
          <span className='text-muted-foreground text-sm'>
            {t('dashboard.productInsights.publishedOn', { date: '12 MAY 2025 - 6:10 PM' })}
          </span>
        </div>
        <img
          src='/images/widgets/image-7.webp'
          alt={t('dashboard.productInsights.imageAlt')}
          className='w-20.5 rounded-md'
        />
      </CardHeader>
      <CardContent>
        <Separator />
      </CardContent>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs'>{t('dashboard.productInsights.productReached')}</span>
            <span className='text-2xl font-semibold'>21,153</span>
          </div>
          <ChartContainer config={productReachChartConfig} className='min-h-13 max-w-18'>
            <BarChart accessibilityLayer data={productReachChartData} barSize={8}>
              <Bar dataKey='reached' fill='var(--color-reached)' radius={2} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs'>{t('dashboard.productInsights.orderPlaced')}</span>
            <span className='text-2xl font-semibold'>2,123</span>
          </div>
          <ChartContainer config={orderPlacedChartConfig} className='min-h-13 max-w-18'>
            <BarChart accessibilityLayer data={orderPlacedChartData} barSize={8}>
              <Bar dataKey='orders' fill='var(--color-orders)' radius={2} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductInsightsCard
