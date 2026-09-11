import { useEffect, useState } from 'react';
import { reload } from 'firebase/auth';
import { useAuth } from '../../../context/AuthContext';
import {
  updateName,
  updatePhone,
  updateWhatsappContact,
  updateBio,
  updateAvatar,
  updateSkills,
  updateLeagueAndAgeCategory,
  updateDisplayBadges,
  updatePreferredCourts,
  updatePreferredZone,
  updateFavouritePlayers,
  updateEmailNotifications,
  updateAvailabilityTags,
  updateAvailableToPlay,
  changeEmail,
  completePendingEmailChange,
  updateEventParticipantDates,
  updateContactMethods,
} from '../services/profileService';
import {
  clearPendingEmailChange,
  emailChangeErrorMessage,
  emailChangeReauthMethod,
  EMAIL_CHANGE_VERIFY_MESSAGE,
  errorCode,
  readPendingEmailChange,
} from '../changeEmailAuth';
import type { ContactMethod } from '../../../types';

export const useProfileActions = () => {
  const { user, refreshProfile } = useAuth();
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });
  const [emailVerificationSentTo, setEmailVerificationSentTo] = useState<string | null>(() => {
    const pending = readPendingEmailChange();
    return pending?.phase === 'verify' ? pending.email : null;
  });

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), type === 'success' ? 3000 : 4000);
  };

  useEffect(() => {
    if (!user) return;
    const existing = readPendingEmailChange();
    if (existing?.phase === 'verify') setEmailVerificationSentTo(existing.email);

    let cancelled = false;
    completePendingEmailChange(user)
      .then((result) => {
        if (cancelled || result !== 'verification-sent') return;
        const pending = readPendingEmailChange();
        if (pending?.email) setEmailVerificationSentTo(pending.email);
        showMessage(EMAIL_CHANGE_VERIFY_MESSAGE, 'success');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        showMessage(emailChangeErrorMessage(error, emailChangeReauthMethod(user.providerData)), 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const withProfileUpdate = async (fn: () => Promise<void>): Promise<boolean> => {
    if (!user) return false;
    setUpdateLoading(true);
    try {
      await fn();
      await refreshProfile();
      showMessage('Profile updated successfully!', 'success');
      return true;
    } catch (error: any) {
      showMessage(error.message || 'Could not update your profile. Please try again.', 'error');
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangeEmail = async (newEmail: string, password?: string) => {
    if (!user) return;
    setUpdateLoading(true);
    try {
      const result = await changeEmail(user, newEmail, password);
      if (result === 'redirect') return;
      setEmailVerificationSentTo(newEmail.trim());
      showMessage(EMAIL_CHANGE_VERIFY_MESSAGE, 'success');
      return true;
    } catch (error: unknown) {
      showMessage(emailChangeErrorMessage(error, emailChangeReauthMethod(user.providerData)), 'error');
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRefreshEmailChange = async () => {
    if (!user) return;
    try {
      await reload(user);
      await refreshProfile();
      clearPendingEmailChange();
      setEmailVerificationSentTo(null);
      showMessage('Email updated successfully.', 'success');
    } catch (error: unknown) {
      const code = errorCode(error);
      if (code.includes('email-not-verified') || code.includes('verification'))
        showMessage('Your email is not verified yet. Please complete verification and try again.', 'error');
      else showMessage('Unable to refresh your email verification. Please try again.', 'error');
    }
  };

  const dismissEmailChange = () => {
    clearPendingEmailChange();
    setEmailVerificationSentTo(null);
  };

  const handleUpdateEventDates = async (participantId: string, dateselected: string[]) => {
    try {
      await updateEventParticipantDates(participantId, dateselected);
      showMessage('Matchday dates updated!', 'success');
    } catch (error) {
      console.error('Error updating dates:', error);
      showMessage('Could not update dates right now.', 'error');
    }
  };

  return {
    updateLoading,
    message,
    emailVerificationSentTo,
    actions: {
      updateName: (name: string) => withProfileUpdate(() => updateName(user!.uid, name)),
      updatePhone: (phone: string) => withProfileUpdate(() => updatePhone(user!.uid, phone)),
      updateWhatsappContact: (whatsappContact: string, sameAsPhone: boolean) =>
        withProfileUpdate(() => updateWhatsappContact(user!.uid, whatsappContact, sameAsPhone)),
      updateBio: (bio: string) => withProfileUpdate(() => updateBio(user!.uid, bio)),
      updateAvatar: (url: string) => withProfileUpdate(() => updateAvatar(user!.uid, url)),
      updateSkills: (skillLevel: number, tournamentPreference: string) =>
        withProfileUpdate(() => updateSkills(user!.uid, skillLevel, tournamentPreference)),
      updateLeagueAgeCategory: (league: "Men's" | "Women's" | '', ageCategory: 'Retired Pro' | 'Juniors' | '') =>
        withProfileUpdate(() => updateLeagueAndAgeCategory(user!.uid, league, ageCategory)),
      updateDisplayBadges: (badgeIds: string[]) => withProfileUpdate(() => updateDisplayBadges(user!.uid, badgeIds)),
      updatePreferredCourts: (courts: string[], zone: string) =>
        withProfileUpdate(() => updatePreferredCourts(user!.uid, courts, zone)),
      updatePreferredZone: (zone: string) => withProfileUpdate(() => updatePreferredZone(user!.uid, zone)),
      updateFavouritePlayers: (players: string[]) =>
        withProfileUpdate(() => updateFavouritePlayers(user!.uid, players)),
      updateEmailNotifications: (enabled: boolean) =>
        withProfileUpdate(() => updateEmailNotifications(user!.uid, enabled)),
      updateContactMethods: (methods: ContactMethod[]) =>
        withProfileUpdate(() => updateContactMethods(user!.uid, methods)),
      updateAvailabilityTags: (tags: string[]) => withProfileUpdate(() => updateAvailabilityTags(user!.uid, tags)),
      updateAvailableToPlay: (available: boolean) =>
        withProfileUpdate(() => updateAvailableToPlay(user!.uid, available)),
      changeEmail: handleChangeEmail,
      refreshEmailChange: handleRefreshEmailChange,
      dismissEmailChange,
      updateEventDates: handleUpdateEventDates,
    },
  };
};
