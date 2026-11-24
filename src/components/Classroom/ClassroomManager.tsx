'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconTrash } from '@tabler/icons-react';

import {
  deleteClassroom,
  inviteClassroomMembers,
  removeClassroomMember,
  renameClassroom,
  setClassroomMemberRole,
} from '@/lib/classroomActions';
import { ClassroomDetails, ClassroomRole } from '@/lib/data';
import { eventBus } from '@/lib/eventBus';

const inputClass =
  "w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white";
const primaryButton =
  "rounded bg-primary px-5 py-2.5 font-medium text-white hover:bg-opacity-90 disabled:opacity-60";
const linkButton = "text-sm font-medium text-primary hover:underline disabled:opacity-60";

/*
  Management panel for one classroom: rename, invite by email, remove members,
  delete. Shown to the classroom's admins and to system admins; only system
  admins (details.canManageAdmins) can add, promote, demote or remove admins.
*/
export default function ClassroomManager({
  details,
  onChanged,
  afterDeleteHref = '/dashboard/home',
}: {
  details: ClassroomDetails;
  onChanged: () => void;
  afterDeleteHref?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(details.name);
  const [emails, setEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<ClassroomRole>('member');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Switching to another classroom (the /admin page reuses this panel) resets the form.
  useEffect(() => {
    setName(details.name);
    setEmails('');
    setInviteRole('member');
    setNotice(null);
  }, [details.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const admins = details.members.filter((m) => m.role === 'admin');
  const members = details.members.filter((m) => m.role !== 'admin');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setNotice({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const onRename = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await renameClassroom(details.id, name);
      if (result.message) return setNotice({ kind: 'error', text: result.message });
      eventBus.emit('classroomsChanged', undefined);
      setNotice({ kind: 'ok', text: 'Classroom renamed.' });
      onChanged();
    });
  };

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await inviteClassroomMembers(details.id, emails, inviteRole);
      if (result.message) return setNotice({ kind: 'error', text: result.message });
      const noun = inviteRole === 'admin' ? 'admin' : 'member';
      const parts: string[] = [];
      if (result.added.length) parts.push(`Added ${result.added.length} ${noun}${result.added.length > 1 ? 's' : ''}.`);
      if (result.emailed.length) parts.push(`Sign-up invitation emailed to ${result.emailed.join(', ')}.`);
      if (result.invalid.length) parts.push(`Not valid email addresses: ${result.invalid.join(', ')}.`);
      if (!parts.length) parts.push(`Everyone listed is already a ${noun}.`);
      setNotice({ kind: result.invalid.length ? 'error' : 'ok', text: parts.join(' ') });
      setEmails(result.invalid.join(', '));
      eventBus.emit('classroomsChanged', undefined);
      onChanged();
    });
  };

  const onRemove = (email: string) => {
    if (!window.confirm(`Remove ${email} from this classroom?`)) return;
    run(async () => {
      const result = await removeClassroomMember(details.id, email);
      if (result.message) return setNotice({ kind: 'error', text: result.message });
      eventBus.emit('classroomsChanged', undefined);
      onChanged();
    });
  };

  const onSetRole = (email: string, role: ClassroomRole) => {
    run(async () => {
      const result = await setClassroomMemberRole(details.id, email, role);
      if (result.message) return setNotice({ kind: 'error', text: result.message });
      eventBus.emit('classroomsChanged', undefined);
      onChanged();
    });
  };

  const onDelete = () => {
    if (!window.confirm(`Delete the classroom "${details.name}"? Members lose access to it; the studies themselves are not deleted.`)) return;
    run(async () => {
      const result = await deleteClassroom(details.id);
      if (result.message) return setNotice({ kind: 'error', text: result.message });
      eventBus.emit('classroomsChanged', undefined);
      router.push(afterDeleteHref);
      onChanged();
    });
  };

  const personList = (people: ClassroomDetails['members'], emptyText: string, isAdminList: boolean) => (
    <div className="max-h-72 overflow-y-auto rounded-sm border border-stroke dark:border-strokedark">
      <table className="w-full table-auto">
        <tbody>
          {people.length === 0 && (
            <tr><td className="py-4 px-4 text-center">{emptyText}</td></tr>
          )}
          {people.map((m) => (
            <tr key={m.email}>
              <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">{m.displayName ?? m.email}</p>
                {m.displayName && <p className="text-sm">{m.email}</p>}
                {!m.hasAccount && <p className="text-sm italic">Invited, not signed up yet</p>}
              </td>
              <td className="border-b border-[#eee] py-3 px-4 text-right dark:border-strokedark">
                <div className="flex items-center justify-end gap-4">
                  {details.canManageAdmins && (
                    <button className={linkButton} disabled={busy}
                      onClick={() => onSetRole(m.email, isAdminList ? 'member' : 'admin')}>
                      {isAdminList ? 'Make member' : 'Make admin'}
                    </button>
                  )}
                  {(!isAdminList || details.canManageAdmins) && (
                    <button className="hover:text-primary" title={`Remove ${m.email}`} onClick={() => onRemove(m.email)} disabled={busy}>
                      <IconTrash />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <h3 className="mb-5 text-lg font-semibold text-black dark:text-white">Manage Classroom</h3>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <form onSubmit={onRename}>
            <label className="mb-2 block font-medium text-black dark:text-white">Classroom name</label>
            <div className="flex gap-3">
              <input className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              <button type="submit" disabled={busy || !name.trim() || name.trim() === details.name} className={primaryButton}>
                Save
              </button>
            </div>
          </form>

          <form onSubmit={onInvite}>
            <label className="mb-2 block font-medium text-black dark:text-white">Invite by email</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="student1@example.com, student2@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p className="mt-1 text-sm">Separate addresses with commas, spaces or new lines.</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {details.canManageAdmins && (
                <select
                  aria-label="Invite as"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ClassroomRole)}
                  className="rounded border-[1.5px] border-stroke bg-transparent px-3 py-2.5 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="member">as members</option>
                  <option value="admin">as admins</option>
                </select>
              )}
              <button type="submit" disabled={busy || !emails.trim()} className={primaryButton}>
                Invite
              </button>
            </div>
          </form>

          {notice && (
            <div className={`rounded-lg border px-4 py-3 ${notice.kind === 'ok'
              ? 'border-green-400 bg-green-50 text-green-800'
              : 'border-red-400 bg-red-100 text-red-700'}`}>
              {notice.text}
            </div>
          )}

          <div>
            <button type="button" onClick={onDelete} disabled={busy}
              className="rounded border border-meta-1 px-5 py-2.5 font-medium text-meta-1 hover:bg-meta-1 hover:text-white disabled:opacity-60">
              Delete classroom
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 font-medium text-black dark:text-white">Admins ({admins.length})</p>
            {personList(admins, 'No admins. A system admin can add one.', true)}
          </div>
          <div>
            <p className="mb-2 font-medium text-black dark:text-white">Members ({members.length})</p>
            {personList(members, 'No members yet. Invite someone by email.', false)}
          </div>
        </div>
      </div>
    </div>
  );
}
