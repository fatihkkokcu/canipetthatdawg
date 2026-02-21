import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { Download, Trash2, ArrowLeft, X, ArrowUpDown, PlusCircle, FileSpreadsheet, FileText, FileImage, Upload, Palette, QrCode, Copy, RefreshCcw, ExternalLink, Share2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DraggableAnimalCard } from '../components/DraggableAnimalCard';
import { AnimalFilters } from '../components/AnimalFilters';
import { Animal } from '../types/Animal';
import { SearchResults } from '../components/SearchResults';
import { DndItemTypes } from '../constants/dndTypes';
import { useAnimalStore } from '../store/animalStore';
import { useToast } from '../context/ToastContext';
import { decodeBucketListFromShare, encodeBucketListForShare } from '../utils/bucketShare';
import { useAnimalFiltersUrlSync } from '../hooks/useAnimalFiltersUrlSync';

type SortOption = 'default' | 'alphabetical' | 'reverse-alphabetical';
type SharedImportData = { ids: string[]; title?: string };

export const BucketListPage: React.FC = () => {
  useAnimalFiltersUrlSync();

  const { bucketList, animals, removeFromBucketList, reorderBucketList, clearBucketList, addToBucketList } = useAnimalStore();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  // Capture the DOM node used by contentDropRef for export purposes
  const contentAreaRef = useRef<HTMLDivElement | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQrDataUrl, setShareQrDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isBuildingShareQr, setIsBuildingShareQr] = useState(false);
  const [sharedImportData, setSharedImportData] = useState<SharedImportData | null>(null);
  const [isSharedViewMode, setIsSharedViewMode] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const [bucketBgColor, setBucketBgColor] = useState<string>('#dbeafe');
  // Customize panel state
  const [activeDesignTab, setActiveDesignTab] = useState<'title' | 'background'>('title');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Background style customization
  const [useBackgroundGradient, setUseBackgroundGradient] = useState<boolean>(false);
  const [gradientFrom, setGradientFrom] = useState<string>('#ebf2ff'); // light blue default
  const [gradientTo, setGradientTo] = useState<string>('#f3e8ff'); // light purple default
  const [gradientDirection, setGradientDirection] = useState<string>('to bottom right');

  // Title style customization
  const defaultTitleColor = '#1f2937'; // tailwind gray-800
  const [titleColor, setTitleColor] = useState<string>(defaultTitleColor);
  const [useTitleGradient, setUseTitleGradient] = useState<boolean>(false);
  const [titleGradientFrom, setTitleGradientFrom] = useState<string>('#1d4ed8'); // blue-700
  const [titleGradientTo, setTitleGradientTo] = useState<string>('#9333ea'); // purple-600
  const [titleGradientDirection, setTitleGradientDirection] = useState<string>('to right');
  const [titleText, setTitleText] = useState<string>('My Petting Bucket List');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; title: string; message: React.ReactNode; variant: 'success' | 'error' }>({ open: false, title: '', message: '', variant: 'success' });
  const didMountRef = useRef(false);
  // Detect touch-capable devices (used to enable tap-to-edit for title)
  const isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints ?? 0) > 0);
  const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showExportMenu && !showColorPicker) return;
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        if (showExportMenu) setShowExportMenu(false);
        if (showColorPicker) setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showExportMenu, showColorPicker]);

  // Load saved background settings from localStorage
  useEffect(() => {
    try {
      const savedTitleText = localStorage.getItem('bucketTitleText');
      if (savedTitleText && savedTitleText.trim()) setTitleText(savedTitleText);
      const saved = localStorage.getItem('bucketBgColor');
      if (saved) setBucketBgColor(saved);
      const savedTitle = localStorage.getItem('bucketTitleColor');
      if (savedTitle) setTitleColor(savedTitle);
      // Backward-compatibility: previously a single toggle controlled both
      const legacyUseGrad = localStorage.getItem('bucketUseGradient');
      const savedBgUseGrad = localStorage.getItem('bucketUseBackgroundGradient');
      const savedTitleUseGrad = localStorage.getItem('bucketUseTitleGradient');
      if (savedBgUseGrad !== null) setUseBackgroundGradient(savedBgUseGrad === 'true');
      else if (legacyUseGrad !== null) setUseBackgroundGradient(legacyUseGrad === 'true');
      if (savedTitleUseGrad !== null) setUseTitleGradient(savedTitleUseGrad === 'true');
      else if (legacyUseGrad !== null) setUseTitleGradient(legacyUseGrad === 'true');
      const savedTitleFrom = localStorage.getItem('bucketTitleGradientFrom');
      if (savedTitleFrom) setTitleGradientFrom(savedTitleFrom);
      const savedTitleTo = localStorage.getItem('bucketTitleGradientTo');
      if (savedTitleTo) setTitleGradientTo(savedTitleTo);
      const savedTitleDir = localStorage.getItem('bucketTitleGradientDirection');
      if (savedTitleDir) setTitleGradientDirection(savedTitleDir);
      const savedFrom = localStorage.getItem('bucketGradientFrom');
      if (savedFrom) setGradientFrom(savedFrom);
      const savedTo = localStorage.getItem('bucketGradientTo');
      if (savedTo) setGradientTo(savedTo);
      const savedDir = localStorage.getItem('bucketGradientDirection');
      if (savedDir) setGradientDirection(savedDir);
    } catch {
      // ignore
    }
  }, []);

  // When entering title edit mode, focus and select text
  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      const el = titleRef.current;
      // Focus and select contents
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);
      el.focus();
    }
  }, [isEditingTitle]);

  const saveTitleFromDom = () => {
    const raw = titleRef.current?.innerText ?? '';
    const next = raw.replace(/\n/g, ' ').trim() || 'My Petting Bucket List';
    setTitleText(next);
    try {
      localStorage.setItem('bucketTitleText', next);
    } catch {
      // ignore localStorage errors
    }
  };

  const handleTitleDoubleClick = () => setIsEditingTitle(true);
  // On touch devices, allow single tap to edit
  const handleTitleClick = () => {
    if (isTouchDevice) setIsEditingTitle(true);
  };
  const handleTitleBlur = () => {
    saveTitleFromDom();
    setIsEditingTitle(false);
  };
  const handleTitleKeyDown: React.KeyboardEventHandler<HTMLHeadingElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Revert DOM to last saved text, then exit
      if (titleRef.current) titleRef.current.innerText = titleText;
      (e.currentTarget as HTMLElement).blur();
    }
  };

  // Persist background/title settings to localStorage (skip initial mount)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    try {
      if (bucketBgColor) localStorage.setItem('bucketBgColor', bucketBgColor);
      else localStorage.removeItem('bucketBgColor');
      if (titleColor) localStorage.setItem('bucketTitleColor', titleColor);
      else localStorage.removeItem('bucketTitleColor');
      localStorage.setItem('bucketUseBackgroundGradient', String(useBackgroundGradient));
      localStorage.setItem('bucketUseTitleGradient', String(useTitleGradient));
      // Remove legacy key if present
      localStorage.removeItem('bucketUseGradient');
      localStorage.setItem('bucketTitleGradientFrom', titleGradientFrom);
      localStorage.setItem('bucketTitleGradientTo', titleGradientTo);
      localStorage.setItem('bucketTitleGradientDirection', titleGradientDirection);
      localStorage.setItem('bucketGradientFrom', gradientFrom);
      localStorage.setItem('bucketGradientTo', gradientTo);
      localStorage.setItem('bucketGradientDirection', gradientDirection);
    } catch {
      // ignore
    }
  }, [bucketBgColor, titleColor, titleGradientFrom, titleGradientTo, titleGradientDirection, useBackgroundGradient, useTitleGradient, gradientFrom, gradientTo, gradientDirection]);

  const isDraggingAvailableAnimal = useDragLayer((monitor) => monitor.isDragging() && monitor.getItemType() === DndItemTypes.AVAILABLE_ANIMAL_CARD);

  const sortedBucketList = [...bucketList].sort((a, b) => {
    switch (sortOption) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'reverse-alphabetical':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    reorderBucketList(dragIndex, hoverIndex);
  };

  const animalById = new Map(animals.map((animal) => [animal.id, animal]));
  const sharedResolvedAnimals = sharedImportData
    ? sharedImportData.ids
      .map((id) => animalById.get(id))
      .filter((animal): animal is Animal => Boolean(animal))
    : [];
  const sharedMissingCount = sharedImportData ? sharedImportData.ids.length - sharedResolvedAnimals.length : 0;

  const removeShareParamFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('share')) return;
    params.delete('share');
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shareParam = params.get('share');
    if (!shareParam) {
      setSharedImportData(null);
      setIsSharedViewMode(false);
      return;
    }

    const decoded = decodeBucketListFromShare(shareParam);
    if (!decoded) {
      setFeedbackModal({
        open: true,
        title: 'Invalid Share Link',
        message: 'This QR/link is invalid or expired.',
        variant: 'error',
      });
      setSharedImportData(null);
      setIsSharedViewMode(false);
      removeShareParamFromUrl();
      return;
    }

    setSharedImportData(decoded);
    // Shared QR links open in preview mode first; import actions are opt-in.
    setIsSharedViewMode(true);
  }, [location.search, removeShareParamFromUrl]);

  const applySharedList = (mode: 'merge' | 'replace') => {
    if (!sharedImportData) return;

    const matchedAnimals = sharedResolvedAnimals;

    const missingCount = sharedImportData.ids.length - matchedAnimals.length;
    const existingIds = new Set((mode === 'replace' ? [] : bucketList).map((animal) => animal.id));
    let importedCount = 0;

    if (mode === 'replace') {
      clearBucketList();
    }

    matchedAnimals.forEach((animal) => {
      if (existingIds.has(animal.id)) return;
      addToBucketList(animal);
      existingIds.add(animal.id);
      importedCount += 1;
    });

    if (sharedImportData.title) {
      setTitleText(sharedImportData.title);
      try {
        localStorage.setItem('bucketTitleText', sharedImportData.title);
      } catch {
        // ignore localStorage errors
      }
    }

    setSharedImportData(null);
    setIsSharedViewMode(false);
    removeShareParamFromUrl();
    setFeedbackModal({
      open: true,
      title: importedCount > 0 ? 'Shared List Imported' : 'No Items Imported',
      message: (
        <span>
          Imported <span className="font-bold text-blue-600">{importedCount}</span> item{importedCount === 1 ? '' : 's'}
          {missingCount > 0 ? (
            <>
              {' '}
              (<span className="font-bold text-amber-600">{missingCount}</span> not found in this version).
            </>
          ) : null}
        </span>
      ),
      variant: importedCount > 0 ? 'success' : 'error',
    });
  };

  const dismissSharedImport = () => {
    setSharedImportData(null);
    setIsSharedViewMode(false);
    removeShareParamFromUrl();
  };

  const openShareQrModal = async () => {
    if (bucketList.length === 0) {
      showToast('Add at least one animal before sharing.', 'info');
      return;
    }

    setShowColorPicker(false);
    setShowExportMenu(false);
    setShowShareModal(true);
    setIsBuildingShareQr(true);
    setShareQrDataUrl('');
    setShareUrl('');

    try {
      const encoded = encodeBucketListForShare(bucketList, titleText);
      const link = new URL('/bucket-list', window.location.origin);
      link.searchParams.set('share', encoded);
      const linkAsText = link.toString();
      const { default: QRCode } = await import('qrcode');

      const qrDataUrl = await QRCode.toDataURL(linkAsText, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      setShareUrl(linkAsText);
      setShareQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating share QR:', error);
      setShowShareModal(false);
      setFeedbackModal({
        open: true,
        title: 'Share Failed',
        message: 'Could not generate the QR code. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsBuildingShareQr(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard.', 'success');
    } catch (error) {
      console.error('Failed to copy share link:', error);
      setFeedbackModal({
        open: true,
        title: 'Copy Failed',
        message: (
          <span>
            Please copy manually:
            <br />
            <span className="font-bold text-blue-600 break-all">{shareUrl}</span>
          </span>
        ),
        variant: 'error',
      });
    }
  };

  const openShareLinkInNewTab = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadShareQr = () => {
    if (!shareQrDataUrl) return;
    const safeTitle = titleText
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const link = document.createElement('a');
    link.href = shareQrDataUrl;
    link.download = `${safeTitle || 'bucket-list'}-share-qr.png`;
    link.click();
    showToast('QR image downloaded.', 'success');
  };

  const shareLinkWithSystemSheet = async () => {
    if (!shareUrl) return;
    if (typeof navigator.share !== 'function') {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share({
        title: titleText || 'My Petting Bucket List',
        text: 'Check out this shared petting bucket list.',
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Native share failed:', error);
      await copyShareLink();
    }
  };

  // Drop target for the main (empty state) drop zone
  const [{ isOver: isEmptyOver, canDrop: canEmptyDrop }, emptyDropRef] = useDrop<
    { animal: Animal },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      const exists = bucketList.some((b) => b.id === item.animal.id);
      if (exists) {
        showToast((
          <span>
            <span className="font-bold text-blue-600">{item.animal.name}</span> is already in your list
          </span>
        ), 'info');
      } else {
        addToBucketList(item.animal);
        showToast((
          <span>
            Added <span className="font-bold text-blue-600">{item.animal.name}</span> to your list
          </span>
        ), 'success');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Separate drop target for the sticky bottom prompt so it also works when list is empty
  const [{ isOver: isStickyOver, canDrop: canStickyDrop }, stickyDropRef] = useDrop<
    { animal: Animal },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      const exists = bucketList.some((b) => b.id === item.animal.id);
      if (exists) {
        showToast((
          <span>
            <span className="font-bold text-blue-600">{item.animal.name}</span> is already in your list
          </span>
        ), 'info');
      } else {
        addToBucketList(item.animal);
        showToast((
          <span>
            Added <span className="font-bold text-blue-600">{item.animal.name}</span> to your list
          </span>
        ), 'success');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Drop target for the filled bucket list content area??
  const [{ isOver: isContentOver, canDrop: canContentDrop }, contentDropRef] = useDrop<
    { animal: Animal },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      const exists = bucketList.some((b) => b.id === item.animal.id);
      if (exists) {
        showToast((
          <span>
            <span className="font-bold text-blue-600">{item.animal.name}</span> is already in your list
          </span>
        ), 'info');
      } else {
        addToBucketList(item.animal);
        showToast((
          <span>
            Added <span className="font-bold text-blue-600">{item.animal.name}</span> to your list
          </span>
        ), 'success');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActiveDropZone = isEmptyOver && canEmptyDrop;
  const isStickyActiveDropZone = isStickyOver && canStickyDrop;
  const isContentActiveDropZone = isContentOver && canContentDrop;
  const shouldShowDropPrompt = isDraggingAvailableAnimal || isActiveDropZone;
  const setEmptyDropNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      emptyDropRef(node);
    },
    [emptyDropRef]
  );
  const setStickyDropNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      stickyDropRef(node);
    },
    [stickyDropRef]
  );
  const setContentDropNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentDropRef(node);
      contentAreaRef.current = node;
    },
    [contentDropRef]
  );
  // Bottom-centered sticky drop zone container
  const stickyDropZoneOuterClassName = `fixed inset-x-0 bottom-6 z-[10000] flex justify-center px-4 transition-all duration-300 sm:px-6 ${
    shouldShowDropPrompt ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
  }`;
  const stickyDropZoneInnerClassName = `flex w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-6 text-center shadow-lg backdrop-blur-sm transition-all duration-300 ${
    isStickyActiveDropZone ? 'border-blue-500 bg-blue-50 shadow-2xl scale-[1.02]' : 'border-blue-300 bg-white/90'
  }`;

  const emptyDropZoneClassName = `border-4 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
    isActiveDropZone
      ? 'border-blue-500 bg-blue-50 shadow-xl'
      : shouldShowDropPrompt
      ? 'border-blue-400 bg-blue-50/70 shadow-lg'
      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
  }`;

  const cloneWithInlinedImages = async (element: HTMLElement, bgOverride?: string) => {
    const isTransparent = (color: string | null | undefined) => {
      if (!color) return true;
      const c = color.trim().toLowerCase();
      if (c === 'transparent') return true;
      // rgba(..., 0) or hsla(..., 0)
      if (/rgba\s*\([^)]*,\s*0\s*\)$/i.test(c)) return true;
      if (/hsla\s*\([^)]*,\s*0\s*\)$/i.test(c)) return true;
      return false;
    };

    const getEffectiveBackground = (el: HTMLElement) => {
      let cur: HTMLElement | null = el;
      let image: string | null = null;
      let color: string | null = null;
      while (cur) {
        const cs = window.getComputedStyle(cur);
        const img = cs.backgroundImage;
        const col = cs.backgroundColor;
        if (img && img !== 'none' && img.trim()) {
          image = img;
          break;
        }
        if (!isTransparent(col)) {
          color = col;
          break;
        }
        cur = cur.parentElement;
      }
      return {
        bgImage: image,
        bgColor: color && !isTransparent(color) ? color : '#ffffff',
      } as { bgImage: string | null; bgColor: string };
    };

    const clone = element.cloneNode(true) as HTMLElement;

    // Remove the outer bucket list border and shadow in export while keeping card borders
    clone.style.border = '0';
    clone.style.boxShadow = 'none';

    // Hide the back faces and any rotated 180deg elements to avoid 3D transform issues
    const backFaces = clone.querySelectorAll("[style*='rotateY(180deg)'], .rotate-y-180");
    backFaces.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // Disable 3D transforms and transitions which html2canvas may not handle well
    const transformElements = clone.querySelectorAll('.transform-style-preserve-3d, .backface-hidden');
    transformElements.forEach((el) => {
      const elh = el as HTMLElement;
      elh.style.transform = 'none';
      elh.style.backfaceVisibility = 'visible';
    });
    const animated = clone.querySelectorAll('[class*="transition"], [style*="transition"], [style*="animation"]');
    animated.forEach((el) => {
      const elh = el as HTMLElement;
      elh.style.transition = 'none';
      elh.style.animation = 'none';
    });

    // Inline images to avoid CORS/taint issues; skip GIFs per requirement
    const imgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute('src');
        if (!src) return;
        const lower = src.toLowerCase();
        if (lower.startsWith('data:')) return;
        if (lower.includes('.gif')) {
          // Do not export GIFs
          img.style.display = 'none';
          return;
        }
        try {
          const res = await fetch(src, { mode: 'cors' });
          const blob = await res.blob();
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute('src', dataUrl);
          img.setAttribute('crossorigin', 'anonymous');
        } catch {
          img.style.visibility = 'hidden';
        }
      })
    );

    // Place clone on-screen but invisible so layout computes correctly
    const rect = element.getBoundingClientRect();
    const { bgImage: effImage, bgColor: effColor } = getEffectiveBackground(element);
    let bgColor = effColor;
    let bgImage: string | null = effImage;
    // If override provided, use it only when not transparent
    if (bgOverride) {
      const o = bgOverride.trim();
      const isGrad = o.startsWith('linear-gradient');
      const transparentOverride = !isGrad && isTransparent(o);
      if (!transparentOverride) {
        if (isGrad) {
          bgImage = o;
          bgColor = 'transparent';
        } else {
          bgColor = o;
          bgImage = 'none';
        }
      }
    }
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    // Keep opacity at 1 so html2canvas actually renders pixels (opacity 0 would produce a transparent canvas)
    container.style.opacity = '1';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    container.style.width = `${rect.width}px`;
    container.style.backgroundColor = bgColor;
    container.style.height = `${rect.height}px`;
    if (bgImage && bgImage !== 'none') {
      container.style.backgroundImage = bgImage;
    }
    clone.style.backgroundColor = bgColor;
    if (bgImage && bgImage !== 'none') {
      clone.style.backgroundImage = bgImage;
    }
    container.appendChild(clone);
    document.body.appendChild(container);
    return { container, node: clone } as const;
  };
  const exportToPNG = async () => {

    if (!contentAreaRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');

      const desiredBg = useBackgroundGradient
        ? `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
        : (bucketBgColor || window.getComputedStyle(contentAreaRef.current).backgroundColor || '#ffffff');
      const { container } = await cloneWithInlinedImages(contentAreaRef.current, desiredBg);
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });

const link = document.createElement('a');
      link.download = 'my-petting-bucket-list.png';
      link.href = canvas.toDataURL();
      link.click();
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  };
  
  const exportToPDF = async () => {
    if (!contentAreaRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const desiredBg = useBackgroundGradient
        ? `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
        : (bucketBgColor || window.getComputedStyle(contentAreaRef.current).backgroundColor || '#ffffff');
      const { container } = await cloneWithInlinedImages(contentAreaRef.current, desiredBg);
      const canvas = await html2canvas(container, {
        // Use null so html2canvas uses the element's own background.
        // Passing a linear-gradient string here causes a parse error.
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        // Crop 1px on the left and top to remove hairlines
        x: 1,
        y: 1,
        width: Math.max(1, container.clientWidth - 1),
        height: Math.max(1, container.clientHeight - 1),
      });
      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;
      const orientation = width > height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] });
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('my-petting-bucket-list.pdf');
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = bucketList.map((a) => ({
        ID: a.id,
        Name: a.name,
        Family: a.family,
        Pettable: a.isPettable ? 'Yes' : 'No',
        ImageURL: a.image_url,
        GifURL: a.gif_url,
        Habitat: a.location?.habitat ?? '',
        Latitude: a.location?.lat ?? '',
        Longitude: a.location?.lng ?? '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bucket List');
      XLSX.writeFile(workbook, 'my-petting-bucket-list.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const parseBoolean = (val: unknown): boolean => {
    if (typeof val === 'boolean') return val;
    const s = String(val ?? '').trim().toLowerCase();
    return ['yes', 'true', '1', 'y'].includes(s);
  };

  const importFromExcel = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
      const workbook = isCsv
        ? XLSX.read(await file.text(), { type: 'string' })
        : XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        setFeedbackModal({
          open: true,
          title: 'Import Failed',
          message: (
            <span>
              No worksheet found in <span className="font-bold text-blue-600 break-all">{file.name}</span>.
            </span>
          ),
          variant: 'error',
        });
        return;
      }

      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (rows.length === 0) {
        setFeedbackModal({
          open: true,
          title: 'Nothing to Import',
          message: (
            <span>
              The selected sheet in <span className="font-bold text-blue-600 break-all">{file.name}</span> is empty.
            </span>
          ),
          variant: 'error',
        });
        return;
      }

      const normKey = (k: string) => k.toString().trim().toLowerCase();
      const get = (r: Record<string, unknown>, keys: string[]) => {
        for (const k of keys) {
          const hit = Object.keys(r).find((kk) => normKey(kk) === normKey(k));
          if (hit) return r[hit];
        }
        return undefined;
      };

      let imported = 0;
      const existingIds = new Set(bucketList.map((b) => b.id));
      rows.forEach((r, idx) => {
        const idRaw = get(r, ['id', 'ID']);
        const nameRaw = get(r, ['name', 'Name']);
        const familyRaw = get(r, ['family', 'Family']);
        const pettableRaw = get(r, ['pettable', 'Pettable', 'isPettable']);
        const imageRaw = get(r, ['image_url', 'ImageURL', 'image', 'Image']);
        const gifRaw = get(r, ['gif_url', 'GifURL', 'gif', 'Gif']);
        const habitatRaw = get(r, ['habitat', 'Habitat']);
        const latRaw = get(r, ['lat', 'latitude', 'Latitude', 'Lat']);
        const lngRaw = get(r, ['lng', 'longitude', 'Longitude', 'Lng', 'Long']);

        const id = (idRaw && String(idRaw).trim()) || `import-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
        const name = (nameRaw && String(nameRaw).trim()) || `Unnamed ${idx + 1}`;
        const family = (familyRaw && String(familyRaw).trim()) || 'Unknown';
        const isPettable = parseBoolean(pettableRaw);
        const image_url = (imageRaw && String(imageRaw).trim()) || '';
        const gif_url = (gifRaw && String(gifRaw).trim()) || '';

        const latNum = latRaw !== undefined && latRaw !== '' ? Number(latRaw) : undefined;
        const lngNum = lngRaw !== undefined && lngRaw !== '' ? Number(lngRaw) : undefined;
        const habitat = (habitatRaw && String(habitatRaw).trim()) || '';

        const animal: Animal = {
          id,
          name,
          image_url,
          isPettable,
          gif_url,
          family,
          ...(latNum !== undefined && lngNum !== undefined
            ? { location: { lat: latNum, lng: lngNum, habitat } }
            : {}),
        };

        if (!existingIds.has(animal.id)) {
          addToBucketList(animal);
          existingIds.add(animal.id);
          imported += 1;
        }
      });

      setFeedbackModal({
        open: true,
        title: 'Import Complete',
        message: (
          <span>
            Imported <span className="font-bold text-blue-600">{imported}</span> item{imported === 1 ? '' : 's'} from{' '}
            <span className="font-bold text-blue-600 break-all">{file.name}</span>
          </span>
        ),
        variant: 'success',
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      setFeedbackModal({
        open: true,
        title: 'Import Failed',
        message: (
          <span>
            Failed to import <span className="font-bold text-blue-600 break-all">{file.name}</span>. Please check the format and try again.
          </span>
        ),
        variant: 'error',
      });
    }
  };

  const onChooseImportFile = () => fileInputRef.current?.click();
  const onFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) importFromExcel(file);
    // Reset the input so the same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Animals
            </Link>

          <div className="flex items-center gap-3 relative ms-auto" ref={exportMenuRef}>
            {/* Hidden file input for Excel import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={onFileInputChange}
            />
            {/* Hidden color input for background selection */}
            <input
              ref={colorInputRef}
              type="color"
              className="hidden"
              value={bucketBgColor || '#ffffff'}
              onChange={(e) => setBucketBgColor(e.target.value)}
            />
            {bucketList.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
                  >
                    <option value="default">Custom</option>
                    <option value="alphabetical">A to Z</option>
                    <option value="reverse-alphabetical">Z to A</option>
                  </select>
                </div>
                <button
                  onClick={clearBucketList}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
                <div className='relative inline-block'>
                  <button
                    onClick={() => { setShowColorPicker(false); setShowExportMenu((s) => !s); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 w-44 rounded-md border border-gray-300 bg-white shadow-lg z-20">
                      <button
                        onClick={() => { setShowExportMenu(false); exportToPNG(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <FileImage className="h-4 w-4 text-blue-600" />
                        PNG
                      </button>
                      <button
                        onClick={() => { setShowExportMenu(false); exportToPDF(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 text-red-600" />
                        PDF
                      </button>
                      <button
                        onClick={() => { setShowExportMenu(false); exportToExcel(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Excel
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={openShareQrModal}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200"
                  title="Share with QR"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Share QR</span>
                </button>
              </>
            )}
            {/* Import button (always visible). When Export exists, this sits to its right. */}
            <button
              onClick={onChooseImportFile}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200"
              title="Import from Excel"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <div className='relative inline-block'>

            
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-gray-300 bg-white shadow-lg z-20 p-3">
                {/* Tabs: Title / Background */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setActiveDesignTab('title')}
                    className={`px-3 py-1.5 text-sm rounded-md border ${activeDesignTab === 'title' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Title
                  </button>
                  <button
                    onClick={() => setActiveDesignTab('background')}
                    className={`px-3 py-1.5 text-sm rounded-md border ${activeDesignTab === 'background' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    Background
                  </button>
                </div>

                {/* Style combobox under each tab */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Style</label>
                  <select
                    value={activeDesignTab === 'title' ? (useTitleGradient ? 'gradient' : 'solid') : (useBackgroundGradient ? 'gradient' : 'solid')}
                    onChange={(e) => {
                      const isGradient = e.target.value === 'gradient';
                      if (activeDesignTab === 'title') setUseTitleGradient(isGradient);
                      else setUseBackgroundGradient(isGradient);
                    }}
                    className="w-full px-2 py-1 border rounded-md text-sm border-gray-300"
                  >
                    <option value="solid">Solid</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {/* Background tab content */}
                {activeDesignTab === 'background' && (
                  <>
                    {!useBackgroundGradient ? (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Background color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={bucketBgColor || '#ffffff'}
                            onChange={(e) => setBucketBgColor(e.target.value)}
                            className="h-9 w-9 p-0 border-0 bg-transparent cursor-pointer"
                            aria-label="Pick color"
                          />
                          <input
                            type="text"
                            value={bucketBgColor}
                            onChange={(e) => setBucketBgColor(e.target.value)}
                            placeholder="#aabbcc"
                            className="flex-1 w-40 ms-auto px-2 py-1 border rounded-md text-sm border-gray-300"
                            aria-label="Color value"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-10">From</span>
                            <input
                              type="color"
                              value={gradientFrom}
                              onChange={(e) => setGradientFrom(e.target.value)}
                              className="h-8 w-8 p-0 border-0 bg-transparent cursor-pointer"
                              aria-label="Gradient start color"
                            />
                            <input
                              type="text"
                              value={gradientFrom}
                              onChange={(e) => setGradientFrom(e.target.value)}
                              className="w-28 px-2 py-1 border rounded-md text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-10">To</span>
                            <input
                              type="color"
                              value={gradientTo}
                              onChange={(e) => setGradientTo(e.target.value)}
                              className="h-8 w-8 p-0 border-0 bg-transparent cursor-pointer"
                              aria-label="Gradient end color"
                            />
                            <input
                              type="text"
                              value={gradientTo}
                              onChange={(e) => setGradientTo(e.target.value)}
                              className="w-28 px-2 py-1 border rounded-md text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Direction</label>
                          <select
                            value={gradientDirection}
                            onChange={(e) => setGradientDirection(e.target.value)}
                            className="w-full px-2 py-1 border rounded-md text-sm border-gray-300"
                          >
                            <option value="to right">Left → Right</option>
                            <option value="to bottom">Top → Bottom</option>
                            <option value="to bottom right">Top-left → Bottom-right</option>
                            <option value="to top right">Bottom-left → Top-right</option>
                          </select>
                        </div>
                        <div
                          className="mt-3 h-8 w-full rounded-md border border-gray-200"
                          style={{ backgroundImage: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})` }}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Title tab content */}
                {activeDesignTab === 'title' && (
                  <>
                    {!useTitleGradient ? (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Title color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={titleColor}
                            onChange={(e) => setTitleColor(e.target.value)}
                            className="h-8 w-8 p-0 border-0 bg-transparent cursor-pointer"
                            aria-label="Title color"
                          />
                          <input
                            type="text"
                            value={titleColor}
                            onChange={(e) => setTitleColor(e.target.value)}
                            className="w-28 px-2 py-1 border rounded-md text-sm border-gray-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0">
                        <label className="block text-xs text-gray-600 mb-1">Title gradient</label>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-10">From</span>
                            <input
                              type="color"
                              value={titleGradientFrom}
                              onChange={(e) => setTitleGradientFrom(e.target.value)}
                              className="h-8 w-8 p-0 border-0 bg-transparent cursor-pointer"
                              aria-label="Title gradient start"
                            />
                            <input
                              type="text"
                              value={titleGradientFrom}
                              onChange={(e) => setTitleGradientFrom(e.target.value)}
                              className="w-28 px-2 py-1 border rounded-md text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-10">To</span>
                            <input
                              type="color"
                              value={titleGradientTo}
                              onChange={(e) => setTitleGradientTo(e.target.value)}
                              className="h-8 w-8 p-0 border-0 bg-transparent cursor-pointer"
                              aria-label="Title gradient end"
                            />
                            <input
                              type="text"
                              value={titleGradientTo}
                              onChange={(e) => setTitleGradientTo(e.target.value)}
                              className="w-28 px-2 py-1 border rounded-md text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Title direction</label>
                          <select
                            value={titleGradientDirection}
                            onChange={(e) => setTitleGradientDirection(e.target.value)}
                            className="w-full px-2 py-1 border rounded-md text-sm border-gray-300"
                          >
                            <option value="to right">Left → Right</option>
                            <option value="to bottom">Top → Bottom</option>
                            <option value="to bottom right">Top-left → Bottom-right</option>
                            <option value="to top right">Bottom-left → Top-right</option>
                          </select>
                        </div>
                        <div
                          className="mt-3 h-8 w-full rounded-md border border-gray-200"
                          style={{ backgroundImage: `linear-gradient(${titleGradientDirection}, ${titleGradientFrom}, ${titleGradientTo})` }}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="mt-3 flex justify-between">
                  <button
                    onClick={() => {
                      setBucketBgColor('#dbeafe');
                      setUseBackgroundGradient(false);
                      setUseTitleGradient(false);
                      setTitleColor(defaultTitleColor);
                      setTitleGradientFrom('#1d4ed8');
                      setTitleGradientTo('#9333ea');
                      setTitleGradientDirection('to right');
                    }}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="px-3 py-1 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
            {/* Background color button (always visible) */}
            <button
              onClick={() => { setShowExportMenu(false); setShowColorPicker((s) => !s); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
              title="Customize appearance"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>
            </div>
          </div>
        </div>

        {isSharedViewMode && sharedImportData ? (
          <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <h2 className="text-2xl font-bold text-indigo-900">
                {sharedImportData.title || 'Shared Bucket List'}
              </h2>
              <p className="mt-2 text-sm text-indigo-700">
                View-only preview: showing {sharedResolvedAnimals.length} of {sharedImportData.ids.length} shared item{sharedImportData.ids.length === 1 ? '' : 's'}.
              </p>
              {sharedMissingCount > 0 && (
                <p className="mt-1 text-sm text-amber-700">
                  {sharedMissingCount} item{sharedMissingCount === 1 ? '' : 's'} were not found in this app version.
                </p>
              )}
            </div>

            <div className="p-6">
              {sharedResolvedAnimals.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
                  No shared animals from this link are available in the current dataset.
                </div>
              ) : (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center">
                  {sharedResolvedAnimals.map((animal) => (
                    <div key={animal.id} className="w-72 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="h-36 flex items-center justify-center mb-3">
                        <img
                          src={animal.image_url}
                          alt={animal.name}
                          loading="lazy"
                          decoding="async"
                          className="max-h-32 w-auto object-contain"
                        />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 text-center">{animal.name}</h3>
                      <p className="text-sm text-gray-500 text-center mt-1">{animal.family}</p>
                      <p className={`text-sm font-semibold text-center mt-3 ${animal.isPettable ? 'text-emerald-600' : 'text-red-600'}`}>
                        {animal.isPettable ? 'Safe to pet' : 'Do NOT pet'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => setIsSharedViewMode(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Import Options
                </button>
                <button
                  onClick={dismissSharedImport}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Close Shared View
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <AnimalFilters />

            {/* Search Results */}
            <SearchResults />

            {/* Drop zone */}
            {bucketList.length === 0 ? (
              <div
                ref={setEmptyDropNodeRef}
                className={emptyDropZoneClassName}
              >
                <div className="text-6xl mb-4">🥹</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">
                  Your bucket list is empty
                </h2>
                <p className="text-gray-500 text-lg">
                  Drag and drop animal cards to build your bucket list!
                </p>
                {shouldShowDropPrompt && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                    Release to add your first animal
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={setContentDropNodeRef}
                className={`rounded-2xl border px-0 py-8 shadow-sm transition-all duration-300 ${
                  isContentActiveDropZone ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={useBackgroundGradient
                  ? { backgroundImage: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})` }
                  : { backgroundColor: bucketBgColor || undefined }
                }
              >
                <div
                  // className="bg-white p-8 rounded-xl shadow-lg transition-all duration-300"
                  className="transition-all duration-300"
                >
              <h2
                ref={titleRef}
                className="text-2xl font-bold text-center mb-8 text-gray-800 outline-none cursor-text"
                style={
                  isEditingTitle
                    ? { color: titleColor || undefined }
                    : useTitleGradient
                    ? {
                        backgroundImage: `linear-gradient(${titleGradientDirection}, ${titleGradientFrom}, ${titleGradientTo})`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent',
                      }
                    : { color: titleColor || undefined }
                }
                onDoubleClick={handleTitleDoubleClick}
                onClick={handleTitleClick}
                onTouchStart={handleTitleClick}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                contentEditable={isEditingTitle}
                suppressContentEditableWarning
                spellCheck={false}
                title={isTouchDevice ? 'Tap to edit' : 'Double-click to edit'}
              >
                {titleText}
              </h2>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-0 justify-items-center">
                {sortOption === 'default' ? (
                  bucketList.map((animal, index) => (
                    <DraggableAnimalCard
                      key={animal.id}
                      animal={animal}
                      index={index}
                      onRemove={removeFromBucketList}
                      onMove={handleMove}
                    />
                  ))
                ) : (
                  // sortedBucketList.map((animal) => (
                  //   <div key={animal.id} className="relative group">
                  //     <AnimalCard animal={animal} isDraggable={false} inBucketList />
                  //     <button
                  //       onClick={() => removeFromBucketList(animal.id)}
                  //       className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  //     >
                  //       <X className="h-4 w-4" />
                  //     </button>
                  //   </div>
                  // ))
                  sortedBucketList.map((animal, index) => (
                    <DraggableAnimalCard
                      key={animal.id}
                      animal={animal}
                      index={index}
                      onRemove={removeFromBucketList}
                      onMove={() => null}
                    />
                  ))
                )}
              </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {bucketList.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-lg text-gray-600">
                  You have <span className="font-bold text-blue-600">{bucketList.length}</span> animals in your bucket list
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {!isSharedViewMode && (
        <div ref={setStickyDropNodeRef} className={stickyDropZoneOuterClassName}>
          <div className={stickyDropZoneInnerClassName}>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow">
                <PlusCircle className="h-6 w-6" />
              </span>
              <p className="text-lg font-semibold text-gray-800">
                Drop to add this buddy to your list
              </p>
              <p className="text-sm text-gray-500">
                We will keep them cozy in your bucket list.
              </p>
          </div>
        </div>
      )}

      {/* Shared Import Modal */}
      {sharedImportData && !isSharedViewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl bg-indigo-50">
              <h3 className="text-lg font-semibold text-indigo-700">Import Shared List</h3>
              <button
                onClick={dismissSharedImport}
                className="p-1 rounded hover:bg-black/5"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-gray-700">
                This shared list contains <span className="font-bold text-indigo-600">{sharedImportData.ids.length}</span>{' '}
                item{sharedImportData.ids.length === 1 ? '' : 's'}.
              </p>
              <p className="text-gray-700">
                Available in this app: <span className="font-bold text-indigo-600">{sharedResolvedAnimals.length}</span>
                {sharedMissingCount > 0 ? (
                  <>
                    {' '}
                    (<span className="font-bold text-amber-600">{sharedMissingCount}</span> missing)
                  </>
                ) : null}
              </p>
              {sharedImportData.title && (
                <p className="text-gray-700">
                  Shared title: <span className="font-semibold text-gray-900">{sharedImportData.title}</span>
                </p>
              )}
              <p className="text-sm text-gray-500">
                Choose how to import these items, or preview first with View Only.
              </p>
            </div>
            <div className="px-5 py-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100">
              <button
                onClick={dismissSharedImport}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSharedViewMode(true)}
                className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                View Only
              </button>
              <button
                onClick={() => applySharedList('merge')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Merge with Current
              </button>
              <button
                onClick={() => applySharedList('replace')}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Replace Current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share QR Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            if (e.currentTarget === e.target) setShowShareModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl bg-indigo-50">
              <h3 className="text-lg font-semibold text-indigo-700">Share Bucket List</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded hover:bg-black/5"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-5 py-5">
              {isBuildingShareQr ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                  <p className="mt-3 text-sm">Generating QR code...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Scan the QR code or open the link. Shared links open in preview mode first.
                  </p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex justify-center">
                    {shareQrDataUrl ? (
                      shareUrl ? (
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                          <img src={shareQrDataUrl} alt="Share bucket list QR code" className="h-64 w-64 max-w-full" />
                        </a>
                      ) : (
                        <img src={shareQrDataUrl} alt="Share bucket list QR code" className="h-64 w-64 max-w-full" />
                      )
                    ) : (
                      <div className="h-64 w-64 flex items-center justify-center text-sm text-gray-500 text-center px-4">
                        QR code could not be generated.
                      </div>
                    )}
                  </div>
                  {shareUrl && (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Share Link</p>
                      <p className="text-xs text-gray-700 break-all">{shareUrl}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={openShareQrModal}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Regenerate
                    </button>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={downloadShareQr}
                        disabled={!shareQrDataUrl}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          shareQrDataUrl ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        Download QR
                      </button>
                      <button
                        onClick={openShareLinkInNewTab}
                        disabled={!shareUrl}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          shareUrl ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Link
                      </button>
                      <button
                        onClick={shareLinkWithSystemSheet}
                        disabled={!shareUrl}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          shareUrl ? 'border-indigo-300 text-indigo-700 hover:bg-indigo-50' : 'border-indigo-200 text-indigo-300 cursor-not-allowed'
                        }`}
                      >
                        <Share2 className="h-4 w-4" />
                        {canUseNativeShare ? 'Share' : 'Copy & Share'}
                      </button>
                      <button
                        onClick={copyShareLink}
                        disabled={!shareUrl}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                          shareUrl ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
                        }`}
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className={`flex items-center justify-between px-5 py-4 rounded-t-2xl ${
              feedbackModal.variant === 'success' ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              <h3 className={`text-lg font-semibold ${feedbackModal.variant === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                {feedbackModal.title}
              </h3>
              <button
                onClick={() => setFeedbackModal((m) => ({ ...m, open: false }))}
                className="p-1 rounded hover:bg-black/5"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-gray-700">{feedbackModal.message}</p>
            </div>
            <div className="px-5 py-3 flex justify-end">
              <button
                onClick={() => setFeedbackModal((m) => ({ ...m, open: false }))}
                className={`px-4 py-2 rounded-lg text-white ${feedbackModal.variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


