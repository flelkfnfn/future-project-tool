'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addEvent(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date = formData.get('event_date') as string

  if (!title || !event_date) {
    return
  }

  const { error } = await supabase.from('calendar_events').insert({ title, description, event_date })

  if (error) {
    // TODO: Handle error
    console.error(error)
    return
  }

  revalidatePath('/calendar')
}
