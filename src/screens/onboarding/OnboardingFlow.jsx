import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useCountry } from '../../context/CountryContext';
import { useAppAlert } from '../../context/AppAlertContext';
import { isValidBirthDate, toBirthDateString } from '../../utils/birthDate';
import ProfileStep from './ProfileStep';
import CountryStep from './CountryStep';
import WelcomeStep from './WelcomeStep';

export default function OnboardingFlow() {
  const { completeOnboarding } = useProfile();
  const { countries, setCountry } = useCountry();
  const { notify } = useAppAlert();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [countryCode, setCountryCode] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameValid = username.trim().length >= 3;
  const birthDateValid = isValidBirthDate(day, month, year);

  const handleSelectCountry = (code) => {
    setCountryCode(code);
    setCountry(code);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const birthDate = toBirthDateString(day, month, year);
      await completeOnboarding({ username: username.trim(), birthDate });
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo guardar tu perfil', variant: 'error' });
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <ProfileStep
        username={username}
        onChangeUsername={setUsername}
        day={day}
        onChangeDay={setDay}
        month={month}
        onChangeMonth={setMonth}
        year={year}
        onChangeYear={setYear}
        continueDisabled={!usernameValid || !birthDateValid}
        onContinue={() => setStep(1)}
      />
    );
  }

  if (step === 1) {
    return (
      <CountryStep
        countries={countries}
        selectedCode={countryCode}
        onSelect={handleSelectCountry}
        search={search}
        onChangeSearch={setSearch}
        onBack={() => setStep(0)}
        continueDisabled={!countryCode}
        onContinue={() => setStep(2)}
      />
    );
  }

  return (
    <WelcomeStep
      username={username.trim()}
      onBack={() => setStep(1)}
      onContinue={handleFinish}
      loading={loading}
    />
  );
}
