import React, { useRef, useState } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { Download, Trash2, ArrowLeft, X, ArrowUpDown, PlusCircle, FileSpreadsheet, FileDown, FileImage, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { AnimalCard } from '../components/AnimalCard';
import { DraggableAnimalCard } from '../components/DraggableAnimalCard';
import { Animal } from '../types/Animal';
import { SearchResults } from '../components/SearchResults';
import { DndItemTypes } from '../constants/dndTypes';
import { useAnimalStore } from '../store/animalStore';

import { useEffect } from 'react';

type SortOption = 'default' | 'alphabetical' | 'reverse-alphabetical';

export const BucketListPage: React.FC = () => {
  const { bucketList, removeFromBucketList, reorderBucketList, clearBucketList, addToBucketList } = useAnimalStore();
  // Capture the DOM node used by contentDropRef for export purposes
  const contentAreaRef = useRef<HTMLDivElement | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; title: string; message: React.ReactNode; variant: 'success' | 'error' }>({ open: false, title: '', message: '', variant: 'success' });

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showExportMenu) return;
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showExportMenu]);

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

  // Drop target for the main (empty state) drop zone
  const [{ isOver: isEmptyOver, canDrop: canEmptyDrop }, emptyDropRef] = useDrop<
    { animal: Animal },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      addToBucketList(item.animal);
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
      addToBucketList(item.animal);
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
      addToBucketList(item.animal);
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
  // Bottom-centered sticky drop zone container
  const stickyDropZoneOuterClassName = `fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 transition-all duration-300 sm:px-6 ${
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

  const cloneWithInlinedImages = async (element: HTMLElement) => {
    const clone = element.cloneNode(true) as HTMLElement;

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
        } catch (e) {
          img.style.visibility = 'hidden';
        }
      })
    );

    // Place clone on-screen but invisible so layout computes correctly
    const rect = element.getBoundingClientRect();
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    container.style.width = `${rect.width}px`;
    container.style.backgroundColor = '#ffffff';
    clone.style.backgroundColor = '#ffffff';
    container.appendChild(clone);
    document.body.appendChild(container);
    return { container, node: clone } as const;
  };
  const exportToPNG = async () => {

    if (!contentAreaRef.current) return;
    try {

      const { container, node } = await cloneWithInlinedImages(contentAreaRef.current);
      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
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
      const { container, node } = await cloneWithInlinedImages(contentAreaRef.current);
      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
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

  const exportToExcel = () => {
    try {
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

      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
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
      const get = (r: Record<string, any>, keys: string[]) => {
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
        } as Animal;

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Animals
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              My Petting Bucket List
            </h1>
          </div>

          <div className="flex items-center gap-3 relative" ref={exportMenuRef}>
            {/* Hidden file input for Excel import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={onFileInputChange}
            />
            {bucketList.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
                  >
                    <option value="default">Order Added</option>
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
                <div>
                  <button
                    onClick={() => setShowExportMenu((s) => !s)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg z-20">
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
                        <FileDown className="h-4 w-4 text-indigo-600" />
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
          </div>
        </div>

        {/* Search Results */}
        <SearchResults />

        {/* Drop zone */}
        {bucketList.length === 0 ? (
          <div
            ref={emptyDropRef}
            className={emptyDropZoneClassName}
          >
            <div className="text-6xl mb-4">🥹</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Your bucket list is empty
            </h2>
            <p className="text-gray-500 text-lg">
              Drag and drop animal cards from the home page to build your petting wishlist!
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
            ref={(node) => { contentDropRef(node as any); contentAreaRef.current = node; }}
            className={`rounded-2xl border bg-white/60 px-0 py-8 shadow-sm transition-all duration-300 ${
              isContentActiveDropZone ? 'border-blue-500 bg-blue-50' : 'border-blue-100'
            }`}
          >
            <div
              // className="bg-white p-8 rounded-xl shadow-lg transition-all duration-300"
              className="transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                🐾 My Petting Bucket List 🐾
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-0 justify-items-center">
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
                  sortedBucketList.map((animal) => (
                    <div key={animal.id} className="relative group">
                      <AnimalCard animal={animal} isDraggable={false} />
                      <button
                        onClick={() => removeFromBucketList(animal.id)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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
      </div>

      {
        // Always render the sticky drop prompt so it shows on first add as well
      }
      <div ref={stickyDropRef} className={stickyDropZoneOuterClassName}>
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
