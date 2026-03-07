import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Home from './components/Home';
import { AGENTS, HOME_AGENT, type Agent, type SharedData, type SavedSchema, type SavedDiagram } from './types';

// ── IndexedDB helpers ──────────────────────────────────────────────────────────
const IDB_NAME = 'labview_assets';
const IDB_STORE = 'diagram_slots';
const IDB_VERSION = 1;

function openDiagramDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'slotIdx' });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

async function loadDiagramsFromDB(): Promise<(SavedDiagram | null)[]> {
  try {
    const db = await openDiagramDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const slots: (SavedDiagram | null)[] = [null, null, null];
        for (const record of req.result as { slotIdx: number; diagram: SavedDiagram }[]) {
          if (record.slotIdx >= 0 && record.slotIdx < 3) slots[record.slotIdx] = record.diagram;
        }
        resolve(slots);
      };
      req.onerror = () => resolve([null, null, null]);
    });
  } catch {
    return [null, null, null];
  }
}

async function saveDiagramToDB(slotIdx: number, diagram: SavedDiagram | null) {
  try {
    const db = await openDiagramDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    if (diagram) store.put({ slotIdx, diagram });
    else store.delete(slotIdx);
  } catch (e) {
    console.error('Failed to save diagram to IndexedDB:', e);
  }
}
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [currentAgent, setCurrentAgent] = useState<Agent>(HOME_AGENT);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [sharedData, setSharedData] = useState<SharedData>(() => {
    try {
      const saved = localStorage.getItem('labview_shared_data');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        step1Description: parsed.step1Description || '',
        step2Json: parsed.step2Json || '',
        savedSchemas: parsed.savedSchemas || [],
      };
    } catch (e) {
      console.error('Failed to load shared data:', e);
      return { step1Description: '', step2Json: '', savedSchemas: [] };
    }
  });

  const updateSharedData = (key: keyof SharedData, value: string) => {
    setSharedData(prev => {
      const newData = { ...prev, [key]: value };
      try {
        localStorage.setItem('labview_shared_data', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save shared data:', e);
      }
      return newData;
    });
  };

  // Diagram slots: exactly 3, fixed positions, persisted to IndexedDB
  const [diagramSlots, setDiagramSlots] = useState<(SavedDiagram | null)[]>([null, null, null]);
  const diagramsReadyRef = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    loadDiagramsFromDB().then(slots => {
      setDiagramSlots(slots);
      diagramsReadyRef.current = true;
    });
  }, []);

  // Persist to IndexedDB whenever slots change (skip before initial load)
  useEffect(() => {
    if (!diagramsReadyRef.current) return;
    diagramSlots.forEach((diagram, idx) => saveDiagramToDB(idx, diagram));
  }, [diagramSlots]);

  const uploadDiagramToSlot = (slotIdx: number, diagram: SavedDiagram) => {
    setDiagramSlots(prev => {
      const updated = [...prev];
      updated[slotIdx] = diagram;
      return updated;
    });
  };

  const renameDiagram = (slotIdx: number, name: string) => {
    setDiagramSlots(prev => {
      const updated = [...prev];
      if (updated[slotIdx]) updated[slotIdx] = { ...updated[slotIdx]!, name };
      return updated;
    });
  };

  const deleteDiagram = (slotIdx: number) => {
    setDiagramSlots(prev => {
      const updated = [...prev];
      updated[slotIdx] = null;
      return updated;
    });
  };

  const saveSchema = (schema: SavedSchema) => {
    setSharedData(prev => {
      const existing = prev.savedSchemas || [];
      // Rotating 3 slots: prepend new, keep max 3
      const updated = [schema, ...existing].slice(0, 3);
      const newData = { ...prev, savedSchemas: updated };
      try {
        localStorage.setItem('labview_shared_data', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save schema:', e);
      }
      return newData;
    });
  };

  const deleteSchema = (schemaId: string) => {
    setSharedData(prev => {
      const updated = (prev.savedSchemas || []).filter(s => s.id !== schemaId);
      const newData = { ...prev, savedSchemas: updated };
      try {
        localStorage.setItem('labview_shared_data', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to delete schema:', e);
      }
      return newData;
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar 
        currentAgent={currentAgent} 
        onSelectAgent={setCurrentAgent} 
        isMobileOpen={isMobileSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <main className="flex-1 h-full w-full relative">
        <div className={`${currentAgent.id === 'home' ? 'h-full w-full overflow-y-auto' : 'hidden'}`}>
          <Home 
            onSelectAgent={setCurrentAgent} 
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        {AGENTS.map((agent) => (
          <div key={agent.id} className={`${currentAgent.id === agent.id ? 'h-full w-full' : 'hidden'}`}>
            <ChatInterface 
              agent={agent} 
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
              isDesktopSidebarOpen={isDesktopSidebarOpen}
              onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              sharedData={sharedData}
              updateSharedData={updateSharedData}
              saveSchema={saveSchema}
              deleteSchema={deleteSchema}
              diagramSlots={diagramSlots}
              uploadDiagramToSlot={uploadDiagramToSlot}
              renameDiagram={renameDiagram}
              deleteDiagram={deleteDiagram}
            />
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
