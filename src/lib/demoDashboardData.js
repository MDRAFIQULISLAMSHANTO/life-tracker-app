/**
 * One-time sample events / reminders / notes for empty dashboard agenda.
 */

export const DEMO_TODAY_KEY = (uid) => `livio_demo_today_${uid || 'anon'}`

export function mergeOneTimeDemoToday(base) {
  const t = new Date().toISOString().slice(0, 10)
  return {
    events: [
      {
        id: 'demo_today_evt_1',
        title: 'Budget review (demo)',
        time: '10:00',
        link: '',
        date: t,
      },
    ],
    reminders: [
      {
        id: 'demo_today_rem_1',
        title: 'Pay rent reminder (demo)',
        time: '09:00',
        completed: false,
        link: '',
        date: t,
      },
    ],
    notes: [
      {
        id: 'demo_today_note_1',
        content: 'Try adding real transactions from Income / Expenses — this note is demo data.',
        createdAt: new Date().toISOString(),
        date: t,
        link: '',
      },
    ],
  }
}
