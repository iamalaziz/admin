'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import type { UserAchievementGroup } from '@/hooks/wordzen/use-achievement-list'
import { useTranslation } from '@/lib/i18n'
import type { AdminUser } from '@/types/wordzen/user-types'

import { Timestamp } from '../shared/primitives'

export interface UserAchievementsSheetProps {
  user: AdminUser | null

  /** The active catalogue with this user's grants folded in, in group order. */
  groups: UserAchievementGroup[]
  onOpenChange: (open: boolean) => void
  onGrant: (code: string) => void
  onRevoke: (code: string) => void
}

/**
 * Grants and revokes for one user, grouped the way the learner app shows them.
 *
 * Each toggle applies on the spot rather than on a save, because each one is its own call:
 * a grant is `POST /api/v1/users/{uid}/achievements` and a revoke is nothing at all yet.
 * Only active achievements are listed — an inactive code is refused by the service.
 */
export function UserAchievementsSheet({ user, groups, onOpenChange, onGrant, onRevoke }: UserAchievementsSheetProps) {
  const { t } = useTranslation()

  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[520px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {t('manage.userAchievements.title', { name: user?.username ?? '' })}
          </SheetTitle>
          <SheetDescription>{t('manage.userAchievements.description')}</SheetDescription>
        </SheetHeader>

        <div className='flex flex-col gap-6 px-4 pb-4'>
          {groups.map(group => (
            <div key={group.code} className='flex flex-col gap-3'>
              <div className='flex items-baseline justify-between gap-2'>
                <span className='text-sm font-medium'>{group.title}</span>
                <span className='text-muted-foreground text-xs'>
                  {group.achievements.filter(achievement => achievement.received).length} / {group.achievements.length}
                </span>
              </div>

              <FieldGroup className='gap-3'>
                {group.achievements.map(achievement => (
                  <Field key={achievement.code} orientation='horizontal' className='items-center justify-between gap-3'>
                    <div className='flex min-w-0 flex-col gap-0.5'>
                      <FieldLabel htmlFor={achievement.code}>{achievement.title}</FieldLabel>
                      <FieldDescription>
                        {achievement.received ? (
                          <>
                            {t('manage.userAchievements.receivedOn')}{' '}
                            <Timestamp value={achievement.receivedAt} withTime />
                          </>
                        ) : (
                          achievement.description
                        )}
                      </FieldDescription>
                    </div>
                    <Switch
                      id={achievement.code}
                      checked={achievement.received}
                      onCheckedChange={granted => (granted ? onGrant(achievement.code) : onRevoke(achievement.code))}
                      aria-label={t('manage.userAchievements.toggle', { title: achievement.title })}
                    />
                  </Field>
                ))}
              </FieldGroup>
            </div>
          ))}
        </div>

        <SheetFooter className='flex-row justify-end gap-2 px-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
