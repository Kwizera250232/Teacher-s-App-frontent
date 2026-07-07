import { useState } from 'react';
import EducationHubHome from './EducationHubHome';
import InstitutionList from './InstitutionList';
import InstitutionProfile from './InstitutionProfile';
import CareerGuidance from './CareerGuidance';
import Opportunities from './Opportunities';

export default function EducationHub() {
  const [view, setView] = useState('home');
  const [params, setParams] = useState({});

  const navigate = (target, opts = {}) => {
    setParams(opts);
    if (target === 'home') setView('home');
    else if (target === 'institutions') setView('institutions');
    else if (target === 'institution') setView('institution');
    else if (target === 'career') setView('career');
    else if (target === 'scholarships') setView('opportunities-scholarships');
    else if (target === 'jobs') setView('opportunities-jobs');
    else if (target === 'mentorship') setView('opportunities-mentorship');
    else if (['university', 'tvet', 'secondary'].includes(target)) {
      setView('institutions');
      setParams({ type: target });
    }
    window.scrollTo(0, 0);
  };

  if (view === 'home') return <EducationHubHome onNavigate={navigate} />;
  if (view === 'institutions') return <InstitutionList initialType={params.type} initialSearch={params.search} onNavigate={navigate} />;
  if (view === 'institution') return <InstitutionProfile institutionId={params.id} onNavigate={navigate} />;
  if (view === 'career') return <CareerGuidance onNavigate={navigate} />;
  if (view.startsWith('opportunities-')) {
    const tab = view.split('-')[1];
    return <Opportunities initialTab={tab} onNavigate={navigate} />;
  }
  return <EducationHubHome onNavigate={navigate} />;
}
