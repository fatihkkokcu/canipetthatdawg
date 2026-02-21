import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Heart, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAnimalStore } from '../store/animalStore';
import { useToast } from '../context/ToastContext';
import { AnimalRiskLevel, getAnimalHandlingTips, getAnimalRiskLevel, getAnimalSafetyReason } from '../utils/animalSafety';
import { getHabitatCategory } from '../utils/habitat';

const riskBadgeStyles: Record<AnimalRiskLevel, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Moderate: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
};

export const AnimalDetailPage: React.FC = () => {
  const { animalId } = useParams();
  const navigate = useNavigate();
  const { animals, bucketList, addToBucketList, removeFromBucketList, togglePetted, favoriteAnimalIds, toggleFavorite } = useAnimalStore();
  const { showToast } = useToast();
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const pendingNavigationRef = useRef<number | null>(null);

  const animal = useMemo(() => animals.find((entry) => entry.id === animalId), [animals, animalId]);
  const animalIndex = useMemo(() => animals.findIndex((entry) => entry.id === animalId), [animals, animalId]);
  const previousAnimal = useMemo(() => {
    if (animalIndex < 0 || animals.length === 0) return null;
    return animals[(animalIndex - 1 + animals.length) % animals.length];
  }, [animalIndex, animals]);
  const nextAnimal = useMemo(() => {
    if (animalIndex < 0 || animals.length === 0) return null;
    return animals[(animalIndex + 1) % animals.length];
  }, [animalIndex, animals]);
  const relatedAnimals = useMemo(() => {
    if (!animal) return [];
    return animals.filter((entry) => entry.family === animal.family && entry.id !== animal.id).slice(0, 4);
  }, [animals, animal]);

  useEffect(() => {
    setTransitionPhase('in');
    const raf = window.requestAnimationFrame(() => {
      setTransitionPhase('idle');
    });
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [animalId]);

  useEffect(() => {
    return () => {
      if (pendingNavigationRef.current) {
        window.clearTimeout(pendingNavigationRef.current);
      }
    };
  }, []);

  const navigateToAnimalWithTransition = useCallback(
    (nextAnimalId: string) => {
      if (!nextAnimalId || nextAnimalId === animalId || transitionPhase === 'out') return;

      setTransitionPhase('out');
      if (pendingNavigationRef.current) {
        window.clearTimeout(pendingNavigationRef.current);
      }

      pendingNavigationRef.current = window.setTimeout(() => {
        navigate(`/animal/${nextAnimalId}`);
      }, 170);
    },
    [animalId, navigate, transitionPhase]
  );

  const goToPreviousAnimal = useCallback(() => {
    if (!previousAnimal) return;
    navigateToAnimalWithTransition(previousAnimal.id);
  }, [navigateToAnimalWithTransition, previousAnimal]);

  const goToNextAnimal = useCallback(() => {
    if (!nextAnimal) return;
    navigateToAnimalWithTransition(nextAnimal.id);
  }, [navigateToAnimalWithTransition, nextAnimal]);

  useEffect(() => {
    const handleKeyNavigation = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
          return;
        }
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousAnimal();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextAnimal();
      }
    };

    window.addEventListener('keydown', handleKeyNavigation);
    return () => {
      window.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [goToNextAnimal, goToPreviousAnimal]);

  if (!animal) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Animals
          </Link>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Animal not found</h1>
            <p className="mt-2 text-gray-600">This animal does not exist in the current dataset.</p>
          </div>
        </div>
      </div>
    );
  }

  const inBucketList = bucketList.some((entry) => entry.id === animal.id);
  const isPetted = Boolean(bucketList.find((entry) => entry.id === animal.id)?.isPetted);
  const isFavorite = favoriteAnimalIds.includes(animal.id);
  const riskLevel = getAnimalRiskLevel(animal);
  const reason = getAnimalSafetyReason(animal);
  const tips = getAnimalHandlingTips(animal);
  const habitatCategory = getHabitatCategory(animal.location?.habitat);

  const handleBucketToggle = () => {
    if (inBucketList) {
      removeFromBucketList(animal.id);
      showToast(`Removed ${animal.name} from your list.`, 'info');
      return;
    }
    addToBucketList(animal);
    showToast(`Added ${animal.name} to your list.`, 'success');
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Animals
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousAnimal}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Go to previous animal"
              title="Previous animal (Left arrow)"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={goToNextAnimal}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Go to next animal"
              title="Next animal (Right arrow)"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={`grid gap-6 transition-all duration-200 ease-out lg:grid-cols-[340px,1fr] ${
            transitionPhase === 'out'
              ? 'translate-y-2 scale-[0.99] opacity-0'
              : transitionPhase === 'in'
              ? '-translate-y-1 opacity-0'
              : 'translate-y-0 scale-100 opacity-100'
          }`}
        >
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-blue-50 p-4">
              <img src={animal.image_url} alt={animal.name} className="max-h-40 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{animal.name}</h1>
            <p className="mt-1 text-sm font-medium text-blue-700">{animal.family}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  animal.isPettable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {animal.isPettable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {animal.isPettable ? 'Pettable' : 'Not Pettable'}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeStyles[riskLevel]}`}
              >
                {riskLevel === 'High' ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Risk: {riskLevel}
              </span>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => toggleFavorite(animal.id)}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  isFavorite ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBucketToggle}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                  inBucketList ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {inBucketList ? 'Remove from Bucket List' : 'Add to Bucket List'}
              </button>

              {inBucketList && (
                <button
                  type="button"
                  onClick={() => togglePetted(animal.id)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    isPetted ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isPetted ? 'Marked as petted' : 'Mark as petted'}
                </button>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Why this safety label?</h2>
              <p className="mt-2 text-gray-700">{reason}</p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Interaction guidance</h2>
              <ul className="mt-3 space-y-2 text-gray-700">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Habitat</h2>
                <Link to="/map" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View on map
                </Link>
              </div>
              <div className="mt-3 flex items-start gap-2 text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p>{animal.location?.habitat ?? 'No habitat data available'}</p>
                  <p className="mt-1 text-sm text-gray-500">Category: {habitatCategory}</p>
                </div>
              </div>
            </article>

            {relatedAnimals.length > 0 && (
              <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Same family</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {relatedAnimals.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/animal/${entry.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateToAnimalWithTransition(entry.id);
                      }}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3 hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="mb-2 flex h-20 items-center justify-center">
                        <img src={entry.image_url} alt={entry.name} className="max-h-16 w-auto object-contain" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{entry.name}</p>
                    </Link>
                  ))}
                </div>
              </article>
            )}

            <p className="text-sm text-gray-500">
              Educational note: labels are for app learning purposes and not a substitute for local wildlife or veterinary guidance.
            </p>
            <p className="text-sm text-gray-500">Tip: use keyboard arrows to move between animals.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
