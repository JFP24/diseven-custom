import { Stage, Layer, Image as KonvaImage, Rect, Group, Text } from 'react-konva';
import useImage from 'use-image';
import React ,{ useEffect, useRef, useState, useCallback } from 'react';
import styles from './diseñoCanvas.module.css';
const reloadIcon = "/assets/ICONOS/icono-reload.png";
const logoDiseven = "/assets/imgHome/disevenhome.png";
import { FolderKanban, Save, RotateCcw } from "lucide-react";
import ProfileBar from "./Auth/ProfileBar.jsx";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Swal from 'sweetalert2';

// Reemplaza la firma y el useImage:
// Reemplaza TU IconWithLabel completo por este:
// REPLACE la firma y el Group de IconWithLabel:
const IconWithLabel = ({
  x, y, size, src, label, isWhite, glowOn = true,
  glowBlur = 18, glowOpacity = 0.45, onSelect // <- NUEVO
}) => {

  console.log(size)
  const [iconImg] = useImage(src);
  if (!iconImg) return null;

  const fontSize = Math.min(14, Math.max(12, Math.round(size * .22)));

  return (
    <Group
      x={x}
      y={y}
      listening
      onClick={onSelect}     
      onTap={onSelect}      
    >
      <KonvaImage
        image={iconImg}
        width={size}
        height={size }
        //shadowOpacity={glowOpacity}
     //   shadowOffset={{ x: 0, y: 0 }}
      />
      <Text
        x={0}
        y={size }
        width={size}
        text={label ?? ''}
        fontSize={fontSize}
        fill={isWhite ? '#FFFFFF' : '#000000ff'}
        align="center"
      
      />
    </Group>
  );
};





const dataSuiche = {

  suiche1: { color: '#FFFFFF', image: '/assets/suichesSencillo/suiche.png' , label: 'Blanca'  },
  suiche2: { color: '#000000', image: '/assets/suichesSencillo/suiche2.png', label: 'Negra' },
  suiche3: { color: '#3A2C28', image: '/assets/suichesSencillo/suiche3.png' , label: 'Cafe'},
  suiche4: { image: '/assets/suichesSencillo/suiche4.png', cssClass: 'brushed', label: 'Negra Cepillada' },
  suiche5: { image: '/assets/suichesSencillo/suiche5.png', cssClass: 'brushedGold', label: 'Dorado Cepillado' },
  suiche6: { image: '/assets/suichesSencillo/suiche6.png', cssClass: 'brushedGray', label: 'Gris Cepillado' },
  suiche7: { image: '/assets/suichesSencillo/suiche7.png', cssClass: 'brushedAlmond', label: 'Almendra Cepillado' },
  suiche8: { image: '/assets/suichesSencillo/suiche8.png', cssClass: 'brushedNickel', label: 'Niquel Cepillado' },
  suiche9: { image: '/assets/suichesSencillo/suiche9.png', cssClass: 'brushedSilver', label: 'Plateada Cepillado' },
  suiche10: { image: '/assets/suichesSencillo/suiche10.png', cssClass: 'brushedTitanium', label: 'Gris Espacil Cepillado' },
  suiche11: { image: '/assets/suichesSencillo/suiche11.png', cssClass: 'brushedWhite', label: 'Blanca Cepillado' },
  suiche12: { color: '#D49A06', image: '/assets/suichesSencillo/suiche12.png', label: 'Dorada ' },
  suiche13: { color: '#818181', image: '/assets/suichesSencillo/suiche13.png', label: 'Gris Lisa' },
  suiche14: { color: '#cbc6a3', image: '/assets/suichesSencillo/suiche14.png', label: 'Ivory' },
  suiche15: { color: '#ece8d2', image: '/assets/suichesSencillo/suiche15.png', label: 'Light Almond' },
  suiche16: { color: '#a4948e', image: '/assets/suichesSencillo/suiche16.png', label: 'Niquel' },
  suiche17: { color: '#D3D3D3', image: '/assets/suichesSencillo/suiche17.png', label: 'Plateada' },
  suiche18: { color: '#504f4e', image: '/assets/suichesSencillo/suiche18.png', label: 'Gris Espacial' },
  suiche19: { color: '#d4af37ff', image: '/assets/suichesSencillo/suiche19.png', label: 'Dorado Espejo Acrilica' },
  suiche20: { color: '#d1a38aff', image: '/assets/suichesSencillo/suiche20.png', label: 'Rosa Cepillado Metalico' },
  suiche21: { color: '#b1b1b1ff', image: '/assets/suichesSencillo/suiche21.png', label: 'Plateada Espejo Acrilica' },

};



const plantillaIds = ['04','05','06','07','08','09','10','11','12','13','14','15','16','17','18'];
const getSlotsKey = (id) => `plantillas-${id}.png`;




const iconNumbers = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13',"29",'30',
  '31','32','33','34','35','36','37','38','39','40',
  '41','57','58','59','60',
  '61','62','63','64','65','66','67','68','69','70',
 '85','86','87','88','89','90',
  '91','92','93','94','95','96','97','98','114','115','116','117','118','119','120',
  '121','122','123','124','125','126',
  '141','142','143','144','145','146','147','148','149','150',
  '151','152','153','154','169','170',
  '171','172','173','174','175','176','177','178','179','180',
  '181','182',"197",'198','199','200',
  '201','202','203','204','205','206','207','208','209','210',
 '225','226','227','228','229','230',
  '231','232','233','234','235','236','237',"238", "239", "240" , "241", "242"  ,"243", "244", "245", "246", "247", "248", "249", "250","251", "252", "253", "254", "255", "256", "257", "258", "259"
];


const ICON_CATEGORIES = {
  Todos: iconNumbers,                 
  Luces: ['01' , "09", "95", "96", "97", "98", "114", "113", "152", "197", "200"], 
  Electrodomesticos: ['02' , "126", "177", "202", "236"],  
     
  Exteriores: ["59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "172", "237", "201"],       
  "Zonas Comunes": ["05", "07", "08" , "10", "11", "12", "32", "34", "36", "37", "38", "40", "41", "57", "58", "150", "151", "198"],            
Entretenimientos: ["33", "39", "86", "87",  "89", "93", "142", "143", "144", "145", "148", "149" , "154", "178", "234", "235", "229"],      
Ventanas : ["115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "174", "175", "169", "85", "35"]  
};

// Slots normalizados
const PLANTILLA_SLOTS = {
  'plantillas-04.png': [
    { x: 0, y: 0, w: 1, h: 1 }
  ],
  'plantillas-05.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 }
  ],
  'plantillas-06.png': [
    { x: 0, y: 0, w: 1, h: 0.74 },
    { x: 0, y: 0.74, w: 1, h: 0.26 }
  ],
  'plantillas-07.png': [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 1 }
  ],
  'plantillas-08.png': [
    { x: 0, y: 0, w: 1, h: 0.50 },
    { x: 0, y: 0.4996, w: 1, h: 0.245 },
    { x: 0, y: 0.7443, w: 1, h: 0.245 }
  ],
  'plantillas-09.png': [
    { x: 0, y: 0, w: 1, h: 0.74 },
    { x: 0, y: 0.74, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.74, w: 0.5, h: 0.25 }
  ],
  'plantillas-10.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
  ],
  'plantillas-11.png': [
    { x: 0, y: 0, w: 1, h: 0.25 },
    { x: 0, y: 0.25, w: 1, h: 0.25 },
    { x: 0, y: 0.50, w: 1, h: 0.25 },
    { x: 0, y: 0.75, w: 1, h: 0.25 }
  ],
  'plantillas-12.png': [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
  ],
  'plantillas-13.png': [
    { x: 0, y: 0, w: 1, h: 0.495 },
    { x: 0, y: 0.5, w: 1, h: 0.24 },
    { x: 0, y: 0.7433, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.7433, w: 0.5, h: 0.25 }
  ],
  'plantillas-14.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],
  'plantillas-15.png': [
    { x: 0, y: 0, w: 1, h: 0.2433 },
    { x: 0, y: 0.2433, w: 1, h: 0.25 },
    { x: 0, y: 0.4953, w: 1, h: 0.25 },
    { x: 0, y: 0.7436, w: 0.5, h: 0.2533 },
    { x: 0.5, y: 0.7436, w: 0.5, h: 0.2533 }
  ],
  'plantillas-16.png': [
    { x: 0, y: 0, w: 1, h: 0.24 },
    { x: 0, y: 0.2433, w: 1, h: 0.25 },
    { x: 0, y: 0.495, w: 0.5, h: 0.2433 },
    { x: 0.5, y: 0.4966, w: 0.5, h: 0.2433 },
    { x: 0, y: 0.7466, w: 0.5, h: 0.2433 },
    { x: 0.5, y: 0.7466, w: 0.5, h: 0.2433 }
  ],
  'plantillas-17.png': [
    { x: 0, y: 0, w: 1, h: 0.25 },
    { x: 0, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],
  'plantillas-18.png': [
    { x: 0, y: 0, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0, w: 0.5, h: 0.25 },
    { x: 0, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],
};




const PL_X = 490, PL_Y = 235, PL_W = 205, PL_H = 395;
// Helpers para saber si el click está dentro de la “carcasa”
const SINGLE_PLATE = { x: 485, y: 228, w: 215, h: 405 };
const DOUBLE_PLATE_LEFT  = { x: 360, y: 235, w: 205, h: 395 };
const DOUBLE_PLATE_RIGHT = { x: 620, y: 235, w: 205, h: 395 };



const getSlotsFor = (filename) => {
  const slots = PLANTILLA_SLOTS[filename] || [];
  return slots.map(s => ({ x: PL_X + s.x * PL_W, y: PL_Y + s.y * PL_H, w: s.w * PL_W, h: s.h * PL_H }));
};


const getSlotsForArea = (area, plantillaId) => {
  const base = PLANTILLA_SLOTS[getSlotsKey(plantillaId)] || [];
  return base.map(s => ({
    x: area.x + s.x * area.w,
    y: area.y + s.y * area.h,
    w: s.w * area.w,
    h: s.h * area.h
  }));
};



const Modal = ({ title, isOpen, onClose, children, width = 720, variant = 'light' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${variant === 'dark' ? styles.modalDark : styles.modalLight}`}
        style={{ maxWidth: width }}
      >
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};


// Tamaño objetivo del icono (ajusta a gusto)
const ICON_TARGET = 54;
const LABEL_FS = 12;
const LABEL_GAP = 6;
const PAD_X = 10;       // margen lateral interno del slot
const PAD_BOTTOM = 8;   // margen inferior al borde del slot
const LARGE_SLOT_MIN_H = 120;   // alto mínimo para considerar el slot “grande”
const LARGE_SLOT_MIN_W = 140;   // ancho mínimo
const LARGE_SLOT_SCALE = 2.0;  // icono 50% más grande en slots grandes


function layoutIconInSlot(slot, withLabel = true) {
  const labelBlock = withLabel ? (LABEL_GAP + LABEL_FS) : 0;

  const maxByWidth  = slot.w - PAD_X * 2;
  const maxByHeight = slot.h - PAD_BOTTOM - labelBlock - 6; // aire arriba
  const baseSize = Math.max(32, Math.min(ICON_TARGET, maxByWidth, maxByHeight));

  // detectar slot grande
  const isLarge = slot.h >= LARGE_SLOT_MIN_H || slot.w >= LARGE_SLOT_MIN_W;

  // si es grande, escalar un poco más pero respetando límites del slot
  const size = isLarge
    ? Math.min(Math.round(baseSize * LARGE_SLOT_SCALE), maxByWidth, maxByHeight)
    : baseSize;

  const x = slot.x + (slot.w - size) / 2;

  // en slots grandes: CENTRADO vertical (grupo icono+texto)
  // en slots normales: alineado por base (más ordenado en filas inferiores)
  let y;
  if (isLarge) {
    const groupH = size + labelBlock;
    y = slot.y + (slot.h - groupH) / 2;
  } else {
    const baseline = slot.y + slot.h - PAD_BOTTOM;
    y = baseline - (size + labelBlock);
  }

  return { x, y, size };
}


function useContainerSize() {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ w: 100, h: 900 });

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cw = entry.contentRect.width;
      // Mantén la relación original 1100:900
      const ratio = 900 / 1100;
      const w = Math.max(320, cw);     // mínimo razonable
      const h = Math.round(w * ratio); // alto en función del ancho
      setSize({ w, h });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
const DESIGN_W = 1100;
const DESIGN_H = 900;


const API_BASE = import.meta.env?.VITE_API_BASE || "https://custom.disevenapp.com/api";

// Helper: Authorization: Bearer <token>
function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return t
    ? { ...extra, Authorization: `Bearer ${t}` }
    : { ...extra };
}

// Helper: manejo de respuesta
async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}


//            --- PROYECTOS ---

// Obtener todos los proyectos desde Mongo
async function apiFetchProjects() {
  const res = await fetch(`${API_BASE}/api/v1/proyectos`, {
    method: "GET",
    headers: authHeaders()
  });
  const data = await handle(res); // { data: [...] }
  return data.data;
}


// Crear un proyecto nuevo en Mongo
async function apiCreateProject(name) {
  const res = await fetch(`${API_BASE}/api/v1/crearProyecto`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name }),
  });
  const data = await handle(res); // { message, data }
  return data.data;
}


async function fetchPlantillasByProject(projectId) {
  const res = await fetch(`${API_BASE}/api/v1/plantillas/${projectId}`, {
    headers: authHeaders()
  });
  return handle(res); // { projectId, count, plantillas: [...] }
}

async function fetchPlantillaById(id) {
  const res = await fetch(`${API_BASE}/api/v1/plantilla/${id}`, {
    headers: authHeaders()
  });
  const data = await handle(res); // { message, data }
  return data.data;
}


async function apiDeletePlantilla(id) {
  const res = await fetch(`${API_BASE}/api/v1/plantilla/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  return handle(res); // { message, data: "<id>" }
}

async function apiRenameProject(id, newName) {
  const res = await fetch(`${API_BASE}/api/v1/proyecto/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name: newName }),
  });
  const data = await handle(res);
  return data.data;
}

async function apiDeleteProject(id) {
  const res = await fetch(`${API_BASE}/api/v1/proyecto/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  const data = await handle(res); // { message, data: <id> }
  return data.data;
}


const DesignerCanvas = () => {
  const nav = useNavigate();
    const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // ❌ Quitamos el redirect automático. Así puedes volver a Home con sesión activa.
  // ✅ Si el modal está abierto y se logra login (user aparece), cerramos y navegamos.
  useEffect(() => {
    if (open && user) {
      setOpen(false);
      nav("/designer");
    }
  }, [open, user, nav]);
  const [canvasHostRef, hostSize] = useContainerSize();
  const scale = Math.min(hostSize.w / DESIGN_W, hostSize.h / DESIGN_H);
// === ADD (cerca a tus constantes): solo 3 previews ===
// Previews rápidos: toma 3 primeros de la categoría actual

const [selectedCategory, setSelectedCategory] = useState('Todos');
const [iconSearch, setIconSearch] = useState('');
const PREVIEW_PLANTILLAS = plantillaIds.slice(4, 7);
const getCategoryList = (cat) => (cat === 'Todos' ? iconNumbers : (ICON_CATEGORIES[cat] || []));
const PREVIEW_ICONOS = getCategoryList(selectedCategory).slice(0, 3);



const [selectedPlantilla, setSelectedPlantilla] = useState('04');
const [selectedSuiche, setSelectedSuiche] = useState(dataSuiche.suiche4.image);
const [selectedColor, setSelectedColor] = useState('#000000');


// Paso 1: pedir nombre del proyecto
const [isProjectNameModalOpen, setProjectNameModalOpen] = useState(false);
const [projectName, setProjectName] = useState('');




 // console.log(selectedColor)
useEffect(() => {
  if (selectedColor !== '#FFFFFF' && selectedColor !== '#000000') {
    setSelectedColor('#000000');
  }
}, [selectedColor]);

const [isIconsModalOpen, setIconsModalOpen] = useState(false);
const [isPlantillasModalOpen, setPlantillasModalOpen] = useState(false);

const [isEditingLabel, setIsEditingLabel] = useState(false);
const [labelInput, setLabelInput] = useState('');

const esFondoNegro = selectedColor?.toLowerCase() === '#000000';
const esFondoBlanco = !esFondoNegro;
// --- estados base (deja esto ANTES de cualquier uso) ---
const [plateMode, setPlateMode] = useState('sencilla');
const [selectedCarcasaDoble, setSelectedCarcasaDoble] = useState('/assets/carcasas doble/carcasa1.png');


const [selectedPlantillaSingle, setSelectedPlantillaSingle] = useState('04');
const [selectedPlantillaLeft,  setSelectedPlantillaLeft]  = useState('04');
const [selectedPlantillaRight, setSelectedPlantillaRight] = useState('04');


const [iconsSingle, setIconsSingle] = useState([]);
const [iconsLeft,   setIconsLeft]   = useState([]);
const [iconsRight,  setIconsRight]  = useState([]);


const [activeArea, setActiveArea] = useState('single');
const [activeSlotIdx, setActiveSlotIdx] = useState(null);
// Plantillas traídas del backend, agrupadas por proyecto
const [templatesByProject, setTemplatesByProject] = useState(new Map());

// Guardados (lista plana y agrupada)
const [savedList, setSavedList] = useState([]);
const [projectGroups, setProjectGroups] = useState(new Map());

// UI de proyectos
const [isProjectsModalOpen, setProjectsModalOpen] = useState(false);
const [selectedProjectName, setSelectedProjectName] = useState(null);
// === cerca de tus helpers de storage (junto a loadTemplates/saveTemplates) ===
const loadSavedList = () => loadTemplates();
const refreshSaved = () => {
  const list = loadSavedList(); // ahora es loadTemplates()
  setSavedList(list);
  setProjectGroups(groupByProject(list));
};

// ¿Qué registro (plantilla) está cargado/siendo editado?
const [currentRecordId, setCurrentRecordId] = useState(null);
const [currentProjectBadge, setCurrentProjectBadge] = useState({ id: null, name: "", place: "" });

// Modo de guardado en el modal: 'update' o 'new'

useEffect(() => { refreshSaved(); }, []);

 // Plantilla por área (respeta fondo negro/blanco)
const getPlantillaPath = (id) =>
  esFondoNegro
    ? `/assets/PLANTILLAS BLANCAS/plantillas-blancas-${id}.png`
    : `/assets/PLANTILLAS/plantillas-${id}.png`;

// IMÁGENES cargadas
const [plantillaSingle] = useImage(getPlantillaPath(selectedPlantillaSingle));
const [plantillaLeft]   = useImage(getPlantillaPath(selectedPlantillaLeft));
const [plantillaRight]  = useImage(getPlantillaPath(selectedPlantillaRight));
const [carcasaSingle]   = useImage(selectedSuiche);
const [carcasaDoble]    = useImage(selectedCarcasaDoble);

// SLOTS por área
const slotsSingle = getSlotsForArea(SINGLE_PLATE, selectedPlantillaSingle) || [];
const slotsLeft   = getSlotsForArea(DOUBLE_PLATE_LEFT,  selectedPlantillaLeft) || [];
const slotsRight  = getSlotsForArea(DOUBLE_PLATE_RIGHT, selectedPlantillaRight) || [];

// Referencia al último snapshot guardado/cargado para comparar


  const slots = getSlotsFor(getSlotsKey(selectedPlantilla));

  const [icons, setIcons] = useState([]); // {id, src, label, slotIdx, x,y,w,h}
  const [selectedIconId, setSelectedIconId] = useState(null);
//  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

const [editingIconId, setEditingIconId] = useState(null);
const [editValue, setEditValue] = useState('');


const [editPos, setEditPos] = useState({ x: 0, y: 0 });
const [editWidth, setEditWidth] = useState(0);


const [isSuicheModalOpen, setSuicheModalOpen] = useState(false);

// Paso 2: guardar plantilla (ya existente)
const [isSaveAskOpen, setSaveAskOpen] = useState(false);



// ===== PROYECTOS =====
const [projects, setProjects] = useState([]);
const [isSelectProjectOpen, setSelectProjectOpen] = useState(false);

const [selectedProjectId, setSelectedProjectId] = useState(null);

const [viewProjectId, setViewProjectId] = useState(null);

const [newProjectName, setNewProjectName] = useState("");


const refreshProjects = useCallback(async () => {
  try {
if (user?.guest) {
  Swal.fire({
    title: 'Acción no permitida',
    text: 'En modo invitado no se puede guardar. ¡Crea una cuenta para hacerlo!',
    icon: 'warning',
    confirmButtonText: 'Entendido',
    background: '#1e293b',      // estilo oscuro
    color: '#fff',
    confirmButtonColor: '#0fa2da'
  });
  return;
}
    // 1. Traer proyectos desde backend
    const list = await apiFetchProjects();
    setProjects(list);

    // 2. Para cada proyecto, traer sus plantillas (resumen)
    const { byProject, flatList } = await fetchAllTemplatesForProjects(list);

    // 3. Guardar en estado React
    setTemplatesByProject(byProject);  // Map(projectId -> [plantillasResumidas])
    setSavedList(flatList);            // lista plana compatible con tu UI actual
    setProjectGroups(groupByProject(flatList));

    // 4. Asegurar selección de proyecto por defecto
    if (!selectedProjectId && list.length > 0) {
      setSelectedProjectId(list[0]._id);
      setSelectedProjectName(list[0].name);
    }

  } catch (err) {
    console.error("No se pudieron cargar proyectos o plantillas:", err);
  }
}, [selectedProjectId]);


useEffect(() => {
  refreshProjects();
}, [refreshProjects]);


const handleSaveTemplateClick = async () => {
  // Traemos última info
  await refreshProjects();
  refreshSaved(); // esto sigue siendo tu cache local de plantillas

  // Caso 1: ya hay una plantilla cargada en el canvas que venía de algún proyecto
  if (currentProjectBadge.id) {
    setSelectedProjectId(currentProjectBadge.id);           // Mongo _id que guardaste antes
    setSelectedProjectName(currentProjectBadge.name || ""); // nombre del proyecto
    setLabelInput(currentProjectBadge.place || "");         // nombre del lugar / habitación
  } else {
    // Caso 2: es la primera vez que va a guardar en esta sesión
    // usamos el primer proyecto de la lista si existe
    if (projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
      setSelectedProjectName(projects[0].name);
      // labelInput lo dejamos como está (así si ya escribió "Habitación 302"
      // en el panel de la izquierda, no lo borramos)
    } else {
      // no hay proyectos todavía -> lo dejamos vacío
      setSelectedProjectId(null);
      setSelectedProjectName("");
      // labelInput se queda como esté
    }
  }

  // Abrimos el modal "Guardar plantilla"
  setSelectProjectOpen(true);
};


async function fetchAllTemplatesForProjects(projectList) {
  const byProject = new Map();
  const flatList = [];

  for (const p of projectList) {
    try {
      const res = await fetchPlantillasByProject(p._id);

      const arr = res.plantillas || [];

      // Guardar en el Map como viene del backend (resumidas)
      byProject.set(p._id, arr);

      // Construimos una versión "flat" parecida a savedList
      for (const tpl of arr) {
        flatList.push({
          id: tpl._id,                  // usamos el _id de Mongo
          projectId: p._id,             // el backend no lo manda, lo inferimos
          projectName: p.name || "",    // el backend no lo manda, lo inferimos
          placeName: tpl.placeName || "(sin nombre)",
          savedAt: tpl.savedAt || new Date().toISOString(),
          plateMode: tpl.plateMode,
          snapshot: null,               // ⚠ todavía no lo tenemos aquí
          preview: null,                // tu backend no manda 'preview' en el listado
          previewThumb: tpl.previewThumb || null,
        });
      }

    } catch (err) {
      console.error("Error cargando plantillas del proyecto", p._id, err);
      byProject.set(p._id, []);
    }
  }

  // orden descendente por fecha
  flatList.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));

  return { byProject, flatList };
}



// --- Helpers de guardado temporal (front-only) ---


const buildTemplateSnapshot = ({ projectName, placeName }) => {
  const base = {
    meta: {
      projectName,
      placeName,
      createdAt: new Date().toISOString(),
      version: "v1",
    },
    plateMode,                  // 'sencilla' | 'doble'
    theme: selectedColor,       // '#000000' | '#FFFFFF'
    suiche: selectedSuiche,     // imagen seleccionada
  };

  if (plateMode === "sencilla") {
    return {
      ...base,
      areas: {
        single: {
          plantillaId: selectedPlantillaSingle,
          icons: iconsSingle.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
        }
      }
    };
  }

  return {
    ...base,
    carcasaDoble: selectedCarcasaDoble,
    areas: {
      left: {
        plantillaId: selectedPlantillaLeft,
        icons: iconsLeft.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
      },
      right: {
        plantillaId: selectedPlantillaRight,
        icons: iconsRight.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
      },
    },
  };
};
const saveTemplateNow = async () => {
  const projectId = selectedProjectId;
  const projectNameClean = (selectedProjectName || "").trim();
  const placeInput = (labelInput || "").trim(); // lo que el usuario está escribiendo ahora

  if (!projectId || !projectNameClean) {
    alert("Primero selecciona o crea un proyecto");
    return;
  }
  
  if (!placeInput) {
    alert("Escribe el nombre del lugar");
    return;
  }

  // Estado lógico actual del canvas (toda la info necesaria para snapshot)
  const snapshot = buildTemplateSnapshot({
    projectName: projectNameClean,
    placeName: placeInput,
  });

  // Capturas visuales
  const previewFull = captureStagePreview?.() || null;
  const thumbSmall  = captureStageThumb?.()    || null;

  // --- DECISIÓN: ¿update o create? ---
  // Estamos editando si ya tenemos un record cargado
  const isEditingExisting = !!currentRecordId;
  // ¿el nombre del lugar sigue igual al original cargado?
  const samePlaceName = currentProjectBadge.place?.trim() === placeInput;

  // Regla:
  // - Si estoy editando y no cambié el nombre -> PUT (actualizar)
  // - En cualquier otro caso -> POST (crear nueva)
  const shouldUpdate = isEditingExisting && samePlaceName;

  try {
    let response;
    let data;

    if (shouldUpdate) {
      // === UPDATE EXISTENTE (PUT) ===
  // PUT (update)
response = await fetch(`${API_BASE}/api/v1/plantilla/${currentRecordId}`, {
  method: "PUT",
  headers: authHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({ projectId, placeName: placeInput, plateMode, preview: previewFull, previewThumb: thumbSmall, snapshot }),
});

      data = await response.json();

      if (!response.ok) {
        console.error("Error actualizando plantilla:", data);
        alert("No se pudo actualizar la plantilla.");
        return;
      }

      console.log("✅ Plantilla actualizada:", data);

      // Mantenemos el mismo currentRecordId
      setCurrentRecordId(currentRecordId);
      setCurrentProjectBadge({
        id: projectId,
        name: projectNameClean,
        place: placeInput,
      });

    } else {
      // === CREAR NUEVA (POST) ===
  response = await fetch(`${API_BASE}/api/v1/crearPlantilla`, { // <- si tu backend usa POST /crearPlantilla; si no, deja /crearPlantilla y crea ese alias en backend o cambia aquí a la ruta que tengas
  method: "POST",
  headers: authHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({ projectId, placeName: placeInput, plateMode, preview: previewFull, previewThumb: thumbSmall, snapshot }),
});

      data = await response.json();

      // if (response.status === 409) {
      //   // Chocaste con otra que ya existe con ese nombre y proyecto
      //   // Esto puede pasar si es "nueva" pero eligieron un nombre repetido
      //   alert("Ya existe una placa con ese nombre en este proyecto.");
      //   return;
      // }

      if (!response.ok) {
        console.error("Error creando plantilla:", data);
        alert("No se pudo crear la plantilla nueva.");
        return;
      }

      console.log("✅ Plantilla creada:", data);

      // Como es nueva, ahora sí actualizamos currentRecordId al nuevo _id
      const created = data.data;
      setCurrentRecordId(created._id);
      setCurrentProjectBadge({
        id: projectId,
        name: projectNameClean,
        place: placeInput,
      });
    }

    // Refrescar la lista en el modal desde Mongo (proyectos + plantillas)
    await refreshProjects();

    // Marcar versión limpia
    anchorCurrentAsClean();

    // Cerrar modal de guardar
    setSelectProjectOpen(false);

    // Reset visual de placa (tú lo querías así)
    resetSwitch();

  } catch (err) {
    console.error("❌ Error guardando plantilla:", err);
    alert("Error de red guardando la plantilla.");
  }
};




const applySnapshot = (snap) => {
  // tema y suiche
  setSelectedColor(snap.theme || '#000000');
  setSelectedSuiche(snap?.suiche || dataSuiche?.suiche4?.image);
  if (snap.plateMode === 'doble' && snap.carcasaDoble) {
    setSelectedCarcasaDoble(snap.carcasaDoble);
  }

  // modo placa
  setPlateMode(snap.plateMode || 'sencilla');

  // plantillas por área
  if (snap.plateMode === 'sencilla') {
    setSelectedPlantillaSingle(snap?.areas?.single?.plantillaId || '04');
    setIconsSingle(
      (snap?.areas?.single?.icons || []).map(({ num, label, slotIdx }) => {
        const slots = getSlotsForArea(SINGLE_PLATE, snap?.areas?.single?.plantillaId || '04');
        const s = slots[slotIdx] || slots[0] || { x: PL_X, y: PL_Y, w: PL_W, h: PL_H };
        const { x, y, size } = layoutIconInSlot(s, true);
        return {
          id: crypto.randomUUID(),
          num,
          src: getIconPath(num),
          label,
          slotIdx,
          x,
          y,
          size
        };
      })
    );
    setIconsLeft([]);
    setIconsRight([]);
  } else {
    setSelectedPlantillaLeft(snap?.areas?.left?.plantillaId || '04');
    setSelectedPlantillaRight(snap?.areas?.right?.plantillaId || '04');

    setIconsLeft(
      (snap?.areas?.left?.icons || []).map(({ num, label, slotIdx }) => {
        const slots = getSlotsForArea(DOUBLE_PLATE_LEFT, snap?.areas?.left?.plantillaId || '04');
        const s = slots[slotIdx] || slots[0] || DOUBLE_PLATE_LEFT;
        const { x, y, size } = layoutIconInSlot(s, true);
        return {
          id: crypto.randomUUID(),
          num,
          src: getIconPath(num),
          label,
          slotIdx,
          x,
          y,
          size
        };
      })
    );

    setIconsRight(
      (snap?.areas?.right?.icons || []).map(({ num, label, slotIdx }) => {
        const slots = getSlotsForArea(DOUBLE_PLATE_RIGHT, snap?.areas?.right?.plantillaId || '04');
        const s = slots[slotIdx] || slots[0] || DOUBLE_PLATE_RIGHT;
        const { x, y, size } = layoutIconInSlot(s, true);
        return {
          id: crypto.randomUUID(),
          num,
          src: getIconPath(num),
          label,
          slotIdx,
          x,
          y,
          size
        };
      })
    );
  }

  // limpiar selección visual
  setActiveArea('single');
  setActiveSlotIdx(null);
  setSelectedIconId(null);
};




const groupByProject = (list) => {
  const map = new Map();
  for (const r of list) {
    const name = r.projectName || "Sin proyecto";
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(r);
  }
  // ordenar items por fecha desc
  for (const [k, arr] of map.entries()) {
    arr.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  }
  return map; // Map<projectName, records[]>
};
// ====== STORAGE KEYS
const PROJECTS_KEY = "diseven:projects";
const TEMPLATES_KEY = "diseven:plantillas";




// ====== TEMPLATES helpers
const loadTemplates = () => {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); }
  catch { return []; }
};


// persistir un record (plantilla) referenciando un proyecto



  const stageRef = useRef(null);
// Rectángulo exacto de la carcasa dibujada (sencilla y doble usan el mismo)
// Caja exacta donde dibujas la carcasa
// zona REAL donde dibujas la carcasa en el Stage

const CARCASA_RECT = { x: 200, y: 40, w: 785, h: 785 };

// márgenes opcionales alrededor para que no quede tan apretado en la miniatura
const PAD_LEFT   = 0;
const PAD_TOP    = 0;
const PAD_RIGHT  = 0;
const PAD_BOTTOM = 60; // dale un poquito de aire abajo


const getExportRect = () => ({
  x: CARCASA_RECT.x - PAD_LEFT,
  y: CARCASA_RECT.y - PAD_TOP,
  w: CARCASA_RECT.w + PAD_LEFT + PAD_RIGHT,
  h: CARCASA_RECT.h + PAD_TOP + PAD_BOTTOM,
});



// === Preview para guardar (PNG liviano, fondo transparente) ===
const captureStagePreview = () => {
  if (!stageRef.current) return null;
  try {
    const rect = getExportRect();
    return stageRef.current.toDataURL({
      mimeType: "image/png",
      pixelRatio: 1,
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
    });
  } catch (err) {
    console.error("Error al capturar preview:", err);
    return null;
  }
};
const captureStageThumb = () => {
  if (!stageRef.current) return null;
  try {
    const rect = getExportRect();
    return stageRef.current.toDataURL({
      mimeType: "image/png",
      pixelRatio: 0.4,
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
    });
  } catch (err) {
    console.error("Error al capturar thumb:", err);
    return null;
  }
};








const resetAll = () => {
  setIconsSingle([]); setIconsLeft([]); setIconsRight([]);
  setActiveSlotIdx(null); setSelectedIconId(null); setEditingIconId(null);
};

// helpers de selección – deben ir ANTES de handleStageMouseDown
const clearSelection = useCallback(() => {
  setActiveSlotIdx(null);
  setSelectedIconId(null);
  setEditingIconId(null);
}, []);

const isInsideAnyPlate = useCallback((p) => {
  if (!p) return false;
  if (plateMode === 'sencilla') {
    return (
      p.x >= SINGLE_PLATE.x && p.x <= SINGLE_PLATE.x + SINGLE_PLATE.w &&
      p.y >= SINGLE_PLATE.y && p.y <= SINGLE_PLATE.y + SINGLE_PLATE.h
    );
  }
  const inLeft =
    p.x >= DOUBLE_PLATE_LEFT.x && p.x <= DOUBLE_PLATE_LEFT.x + DOUBLE_PLATE_LEFT.w &&
    p.y >= DOUBLE_PLATE_LEFT.y && p.y <= DOUBLE_PLATE_LEFT.y + DOUBLE_PLATE_LEFT.h;

  const inRight =
    p.x >= DOUBLE_PLATE_RIGHT.x && p.x <= DOUBLE_PLATE_RIGHT.x + DOUBLE_PLATE_RIGHT.w &&
    p.y >= DOUBLE_PLATE_RIGHT.y && p.y <= DOUBLE_PLATE_RIGHT.y + DOUBLE_PLATE_RIGHT.h;

  return inLeft || inRight;
}, [plateMode]);



const handleStagePointerDown = useCallback((e) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  if (!pos) return;

  // Corrige por scale del Stage
  const p = { x: pos.x / scale, y: pos.y / scale };

  // Si toca fuera de cualquier carcasa, limpia selección
  if (!isInsideAnyPlate(p)) { clearSelection(); return; }

  // ¿en qué área cayó?
  let area = 'single';
  let areaSlots = slotsSingle;

  if (plateMode === 'doble') {
    const inLeft =
      p.x >= DOUBLE_PLATE_LEFT.x && p.x <= DOUBLE_PLATE_LEFT.x + DOUBLE_PLATE_LEFT.w &&
      p.y >= DOUBLE_PLATE_LEFT.y && p.y <= DOUBLE_PLATE_LEFT.y + DOUBLE_PLATE_LEFT.h;

    const inRight =
      p.x >= DOUBLE_PLATE_RIGHT.x && p.x <= DOUBLE_PLATE_RIGHT.x + DOUBLE_PLATE_RIGHT.w &&
      p.y >= DOUBLE_PLATE_RIGHT.y && p.y <= DOUBLE_PLATE_RIGHT.y + DOUBLE_PLATE_RIGHT.h;

    if (!inLeft && !inRight) { clearSelection(); return; }

    area = inLeft ? 'left' : 'right';
    areaSlots = inLeft ? slotsLeft : slotsRight;
  }

  // ¿Qué slot golpeó?
  const hitIdx = (areaSlots || []).findIndex(
    s => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h
  );

  if (hitIdx === -1) { clearSelection(); return; }

  setActiveArea(area);
  setActiveSlotIdx(hitIdx);
}, [scale, plateMode, slotsSingle, slotsLeft, slotsRight, clearSelection]);


// Reposicionar cuando cambian plantillas o color
useEffect(() => {
  setIconsSingle(prev =>
    prev.map(ic => {
      const s = slotsSingle[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaSingle, selectedColor, slotsSingle.length]);

useEffect(() => {
  setIconsLeft(prev =>
    prev.map(ic => {
      const s = slotsLeft[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaLeft, selectedColor, slotsLeft.length]);

useEffect(() => {
  setIconsRight(prev =>
    prev.map(ic => {
      const s = slotsRight[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaRight, selectedColor, slotsRight.length]);

// Al cambiar de modo, limpia selección
useEffect(() => { setActiveSlotIdx(null); setSelectedIconId(null); }, [plateMode]);



  const getIconPath = (num) => (
    esFondoBlanco
      ? `/assets/ICONOS NEGROS/ICONOS BOTNOERAS-${num}.png`
      : `/assets/ICONOS BLANCOS/ICONOS BOTNOERAS blanco-${num}.png`
  );



const placeOrReplaceIcon = (num, label = '') => {
  const src = getIconPath(num);
  const area = plateMode === 'sencilla' ? 'single' : activeArea; // 'single'|'left'|'right'
  const slotsMap = { single: slotsSingle, left: slotsLeft, right: slotsRight };
  const iconsMap = { single: iconsSingle, left: iconsLeft, right: iconsRight };
  const setMap   = { single: setIconsSingle, left: setIconsLeft, right: setIconsRight };

  const slots = slotsMap[area] || [];
  const curIcons = iconsMap[area] || [];
  if (!slots.length) return;

  let target = activeSlotIdx != null
    ? activeSlotIdx
    : findFirstEmptySlot(curIcons, slots.length, 0);

  if (target == null) return;

  const slot = slots[target];
  const { x, y, size } = layoutIconInSlot(slot, true);

  const prev = curIcons.filter(ic => (ic.slotIdx ?? -1) !== target);
   const newIcon = {
    id: crypto.randomUUID(),
    num,                       // <- guardamos el número
    src,                       // <- ruta acorde al fondo actual
    label,
    slotIdx: target, x, y, size
  };

  setMap[area]([...prev, newIcon]);
  setSelectedIconId(newIcon.id);
  setLabelInput(label ?? '');
  setActiveSlotIdx(target);
};




 const saveLabel = () => {
  const apply = arr => arr.map(ic => ic.id === selectedIconId ? { ...ic, label: labelInput } : ic);
  setIconsSingle(apply);
  setIconsLeft(apply);
  setIconsRight(apply);
  setIsEditingLabel(false);
};// === ADD (arriba, junto a helpers) ===
const isSlotOccupied = (iconsArr, slotIdx) =>
  iconsArr.some(ic => (ic.slotIdx ?? 0) === slotIdx);

const findFirstEmptySlot = (iconsArr, slotsLen, startIdx = 0) => {
  if (!slotsLen) return null;
  for (let step = 0; step < slotsLen; step++) {
    const idx = (startIdx + step) % slotsLen;
    if (!isSlotOccupied(iconsArr, idx)) return idx;
  }
  return null; // no hay libres
};

  // Atajos de teclado para mover icono seleccionado
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!selectedIconId) return;
      const delta = e.shiftKey ? 10 : 1;
      setIcons(prev => prev.map(ic => {
        if (ic.id !== selectedIconId) return ic;
        if (e.key === 'ArrowLeft')  return { ...ic, x: ic.x - delta };
        if (e.key === 'ArrowRight') return { ...ic, x: ic.x + delta };
        if (e.key === 'ArrowUp')    return { ...ic, y: ic.y - delta };
        if (e.key === 'ArrowDown')  return { ...ic, y: ic.y + delta };
        return ic;
      }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIconId]);


useEffect(() => {
  if (!slots.length) return;
  setIcons(prev =>
    prev.map(ic => {
      const slot = slots[ic.slotIdx ?? 0];
      if (!slot) return ic;
      const { x, y, size } = layoutIconInSlot(slot, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantilla, selectedColor, slots.length]);

const handleSaveEdit = () => {
  setIcons(prev =>
    prev.map(ic =>
      ic.id === editingIconId ? { ...ic, label: editValue } : ic
    )
  );
  setEditingIconId(null);
};

// Dentro de DesignerCanvas (arriba de return)
const resetIcons = () => {
  setIcons([]);
  setSelectedIconId(null);
  setEditingIconId(null);
  setActiveSlotIdx(0);
};


useEffect(() => {
  resetIcons();
}, [selectedColor]);

useEffect(() => {
  if (plateMode !== 'doble') return;
  const list = Object.values(dataSuiche);
  const idx = list.findIndex(s => s.image === selectedSuiche);
  if (idx >= 0) {
    setSelectedCarcasaDoble(`/assets/carcasas doble/carcasa${idx + 1}.png`); // ajusta ruta/extensión
  }
}, [plateMode, selectedSuiche]);

const labelInputRef = useRef(null);
const overlayInputRef = useRef(null);


const handleSelectIcon = (iconId) => {
  const ic =
    iconsSingle.find(i => i.id === iconId) ||
    iconsLeft.find(i => i.id === iconId) ||
    iconsRight.find(i => i.id === iconId);

  if (!ic) return;

  setSelectedIconId(iconId);
  setLabelInput(ic.label ?? '');

  // Dale un tick para que el input exista en el DOM y fócalo (gesto de usuario activo)
  setTimeout(() => {
    labelInputRef.current?.focus({ preventScroll: true });
    // Opcional: selecciona todo el texto
    try { labelInputRef.current?.setSelectionRange(0, (labelInputRef.current.value || '').length); } catch {}
  }, 0);
};


const modalVariant = selectedColor?.toLowerCase() === '#ffffff' ? 'dark' : 'light';


// Cambia la imagen de TODOS los iconos al set de blanco/negro correspondiente
useEffect(() => {
  const swap = (arr) =>
    arr.map(ic => ic.num ? { ...ic, src: getIconPath(ic.num) } : ic);

  setIconsSingle(prev => swap(prev));
  setIconsLeft(prev => swap(prev));
  setIconsRight(prev => swap(prev));
}, [esFondoBlanco]); // o [selectedColor]

const themeKey = selectedColor?.toLowerCase() === '#000000' ? 'dark' : 'light';

useEffect(() => {
  if (editingIconId && overlayInputRef.current) {
    overlayInputRef.current.focus({ preventScroll: true });
    try { overlayInputRef.current.setSelectionRange(0, overlayInputRef.current.value.length); } catch {}
  }
}, [editingIconId]);

// Marca la versión actual del canvas como "sin cambios pendientes"
const anchorCurrentAsClean = () => {
  // Ojo: aquí vamos a usar el snapshot actual para "congelar" estado guardado,
  // mismo patrón que usas en buildTemplateSnapshot.
  const badgeProjectName =
    currentProjectBadge?.name || selectedProjectName || "";
  const badgePlaceName =
    currentProjectBadge?.place || labelInput || "";

 buildTemplateSnapshot({
    projectName: badgeProjectName,
    placeName: badgePlaceName,
  });


};





const resetSwitch = () => {
  setPlateMode('sencilla');
  setSelectedSuiche(dataSuiche.suiche4.image);              
  setSelectedCarcasaDoble('/assets/carcasas doble/carcasa1.png');
  setSelectedColor('#000000');                                // fondo por defecto
  setSelectedPlantillaSingle('04');
  setSelectedPlantillaLeft('04');
  setSelectedPlantillaRight('04');
  resetAll();
  setActiveArea('single');
  setActiveSlotIdx(null);
};






  return (
    <div className={styles.contenedor}>
      
    <div style={{  display: "grid", gridTemplateRows: "auto 1fr" }}>
      <ProfileBar onClickHome={() => nav("/")} />
     <div className={styles.contendor3}>
  <button
  className={styles.smallButton3}
  onClick={() => { 
    refreshProjects(); 
    refreshSaved(); 
    setViewProjectId(null); 
    setProjectsModalOpen(true); 
  }}
>
  <FolderKanban /> Mis Proyectos
</button>
  <button className={styles.smallButton3} onClick={handleSaveTemplateClick}>
     <Save  /> Guardar
  </button>

</div>
    </div>



<button
  type="button"
  className={styles.smallButton2reset}
  onClick={resetSwitch}
  title="Reiniciar suiche"
>
  <img src={reloadIcon} alt="reload template"  className={styles.imagenR}/>
  <p>Reset</p>
</button>



<Modal
 title={
    viewProjectId
      ? `Proyecto: ${projects.find(p => p._id === viewProjectId)?.name || ''}`
      : "Proyectos"
  }
  isOpen={isProjectsModalOpen}
  onClose={() => { setProjectsModalOpen(false); setViewProjectId(null); }}
  width={860}
  variant={modalVariant}
>
  {/* 👇 SOLO mostramos selección/creación de proyectos si NO estamos dentro de uno */}
{!viewProjectId && (
  <>
    {/* Lista de proyectos con radio + renombrar + eliminar */}
    <div
      style={{
        maxHeight: 260,
        overflow: 'auto',
        border: '1px solid rgba(0,0,0,.1)',
        borderRadius: 8,
        padding: 8
      }}
    >
      {projects.length === 0 ? (
        <div style={{ fontSize: 13, opacity: .7 }}>Aún no hay proyectos.</div>
      ) : projects.map(p => (
        <label
          key={p._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 4px',
            cursor: 'pointer'
          }}
        >
          <input
            type="radio"
            name="proj"
            checked={selectedProjectId === p._id}
            onChange={() => {
              setSelectedProjectId(p._id);
              setSelectedProjectName(p.name);
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 12, opacity: .6 }}>
              {new Date(p.createdAt).toLocaleString()}
            </div>
          </div>

      <button
  className={styles.smallButton2}
  onClick={async (e) => {
    e.preventDefault();
    const nn = prompt("Renombrar proyecto:", p.name);
    if (!nn || !nn.trim()) return;

    try {
      await apiRenameProject(p._id, nn.trim());

      // Si justo estamos parados sobre este proyecto como seleccionado,
      // actualizamos también el nombre mostrado en el canvas
      if (selectedProjectId === p._id) {
        setSelectedProjectName(nn.trim());
      }

      // Y recargamos todo (proyectos + plantillas asociadas)
      await refreshProjects();

    } catch (err) {
      console.error("Error renombrando proyecto:", err);
      alert(err.message || "No se pudo renombrar el proyecto");
    }
  }}
>
  Renombrar
</button>

<button
  className={styles.smallButton2}
  onClick={async (e) => {
    e.preventDefault();
    const seguro = confirm("¿Eliminar este proyecto y TODAS sus plantillas?");
    if (!seguro) return;

    try {
      await apiDeleteProject(p._id);

      // Si justo estábamos parados en ese proyecto
      if (selectedProjectId === p._id) {
        setSelectedProjectId(null);
        setSelectedProjectName("");
      }

      // Limpiamos el canvas si lo que estaba cargado pertenecía a este proyecto
      if (currentProjectBadge.id === p._id) {
        setCurrentRecordId(null);
        setCurrentProjectBadge({ id: null, name: "", place: "" });
        resetSwitch();
      }

      // Volvemos a cargar lista de proyectos y plantillas desde backend
      await refreshProjects();

    } catch (err) {
      console.error("Error eliminando proyecto:", err);
      alert(err.message || "No se pudo eliminar el proyecto");
    }
  }}
  style={{ borderColor: '#ef4444', color: '#ef4444' }}
>
  Eliminar
</button>

        </label>
      ))}
    </div>

  
<div style={{ display: 'grid', gap: 8, marginTop: 8, marginBottom: 18 }}>
  <div style={{ fontSize: 14, opacity: .8 }}>Nuevo Proyecto:</div>

  <div style={{ display: 'flex', gap: 8 }}>
    <input
      type="text"
      placeholder="Nombre del nuevo proyecto"
      value={newProjectName}
      onChange={(e) => setNewProjectName(e.target.value)}
      style={{
        flex: 1,
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid #ccc'
      }}
    />

    <button
      className={styles.smallButton}
      onClick={async () => {
        if (!newProjectName.trim()) {
          alert("Escribe un nombre de proyecto");
          return;
        }

        try {
if (user?.guest) {
  Swal.fire({
    title: 'Acción no permitida',
    text: 'En modo invitado no se puede guardar. ¡Crea una cuenta para hacerlo!',
    icon: 'warning',
    confirmButtonText: 'Entendido',
    background: '#1e293b',      // estilo oscuro
    color: '#fff',
    confirmButtonColor: '#0fa2da'
  });
  return;
}
          const newProj = await apiCreateProject(newProjectName.trim());
          

          await refreshProjects(); 
        
          setSelectedProjectId(newProj._id);
          setSelectedProjectName(newProj.name);

          // limpia el input
          setNewProjectName("");
        } catch (err) {
          console.error("Error creando proyecto:", err);
          alert("No se pudo crear el proyecto");
        }
      }}
    >
      Crear
    </button>
    
  </div>
</div>

  </>
)}

  {/* Ahora la cuadrícula de proyectos o del proyecto abierto */}
  {!viewProjectId ? (
    // VISTA GENERAL DE TODOS LOS PROYECTOS
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16
      }}
    >
      {projects.length === 0 && (
        <div style={{ gridColumn: '1 / -1', opacity: .7 }}>
          Aún no hay proyectos.
        </div>
      )}

 {projects.map((p) => {
  const items = savedList
    .filter(r => r.projectId === p._id) // ojo aquí
    .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));

  const last = items[0];
  const hero = last?.previewThumb || last?.preview || null;

  return (
    
    <button
      key={p._id}
      onClick={() => setViewProjectId(p._id)}
      style={{
        textAlign: 'left',
        border: '1px solid rgba(0,0,0,.10)',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#f3f1f1ff',
        cursor: 'pointer',
        padding: 0,
        boxShadow: '0 6px 18px rgba(0,0,0,.06)'
      }}
    >
      
      <div style={{
        height: 220,
        background: '#b3b3b3ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
      }}>
        {hero ? (
          <img
            src={hero}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        ) : (
          <div style={{ opacity: .6, fontSize: 13 }}>Sin imagen</div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
        <div style={{ fontSize: 12, opacity: .7 }}>
          {items.length} plantilla(s)
        </div>
        <div style={{ fontSize: 12, opacity: .55, marginTop: 4 }}>
          Creado: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
        </div>
      </div>
    </button>
  );
})}

    </div>
  ) : (
    // DETALLE DENTRO DE UN PROYECTO
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16
      }}
    >
      {/* barra superior con Volver y contador */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          className={styles.smallButton2}
          onClick={() => setViewProjectId(null)}
        >
          ← Volver
        </button>
        <div style={{ fontSize: 12, opacity: .7 }}>
          {(savedList.filter(r => r.projectId === viewProjectId)).length} elemento(s)
        </div>
      </div>

      {savedList
        .filter(r => r.projectId === viewProjectId)
        .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt))
        .map((r) => {
          const hero = r.previewThumb || r.preview || null;
          return (
            <div
              key={r.id}
              style={{
                border: '1px solid rgba(0,0,0,.10)',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 6px 18px rgba(0,0,0,.06)'
              }}
            >
              <div style={{
                height: 290,
                background: '#b4b4b4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                borderBottom: '1px solid rgba(0,0,0,.08)'
              }}>
                {hero ? (
                  <img
                    src={hero}
                    alt=""
                    style={{
                      maxWidth: '110%',
                      maxHeight: '110%',
                      display: 'block',
                      objectFit: 'contain',
                      marginLeft: '0',
                      marginRight: '24px'
                    }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ opacity: .6, fontSize: 13 }}>Sin imagen</div>
                )}
              </div>

              <div style={{ padding: 12 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    marginBottom: 4,
                    color: "black"
                  }}
                >
                  {r.placeName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: .7,
                    marginBottom: 10,
                    color: "black"
                  }}
                >
                  {new Date(r.savedAt).toLocaleString()}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    color: "black"
                  }}
                >
           <button
  className={styles.smallButton2}
  onClick={async () => {
    try {
      const full = await fetchPlantillaById(r.id);

      applySnapshot(full.snapshot);

      setCurrentRecordId(full._id);
      setCurrentProjectBadge({
        id: full.projectId,
        // usamos el nombre del proyecto que ya conocemos en memoria
        name: r.projectName,
        place: full.placeName
      });

      setSelectedProjectId(full.projectId);
      setSelectedProjectName(r.projectName);
      setLabelInput(full.placeName);

      setProjectsModalOpen(false);
      setViewProjectId(null);
    } catch (err) {
      console.error("Error cargando plantilla completa:", err);
      alert("No se pudo cargar la plantilla");
    }
  }}
>
  Cargar
</button>



<button
  className={styles.smallButton2}
  onClick={async () => {
    const seguro = confirm('¿Eliminar esta plantilla del proyecto?');
    if (!seguro) return;

    try {
      await apiDeletePlantilla(r.id);

      // Si la que borramos era la actualmente cargada en el canvas,
      // limpiamos referencias para evitar incoherencias
      if (currentRecordId === r.id) {
        setCurrentRecordId(null);
        setCurrentProjectBadge({ id: null, name: "", place: "" });
        // opcional: podríamos también hacer resetSwitch() aquí,
        // para sacar del canvas lo que estaba cargado
        resetSwitch();
      }

      // Volvemos a pedirle al backend la lista de proyectos + plantillas
      await refreshProjects();
    } catch (err) {
      console.error("Error eliminando plantilla:", err);
      alert("No se pudo eliminar la plantilla.");
    }
  }}
  style={{
    borderColor: '#ef4444',
    color: '#ef4444'
  }}
>
  Eliminar
</button>


                </div>
              </div>
            </div>
          );
        })}
    </div>
  )}
</Modal>




<Modal
  title="Nombre del proyecto"
  isOpen={isProjectNameModalOpen}
  onClose={() => setProjectNameModalOpen(false)}
  width={520}
  variant={modalVariant}
>
  <div style={{ display: 'grid', gap: 12, fontSize: 15, lineHeight: 1.5 }}>
    <p>Agrega el nombre del proyecto donde deseas guardar esta plantilla.</p>
<div style={{ display: 'grid', gap: 8 }}>

</div>

    <input
      type="text"
      placeholder="Ejemplo: Hotel Mar Azul, Casa Medellín..."
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid #ccc',
        fontSize: 15,
        width: '100%',
      }}
    />

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
      <button className={styles.smallButton2} onClick={() => setProjectNameModalOpen(false)}>
        Cancelar
      </button>
      <button
        className={styles.smallButton}
        onClick={() => {
          if (!projectName.trim()) return alert('Por favor escribe un nombre de proyecto');
          setProjectNameModalOpen(false);
          setSaveAskOpen(true); // pasa al siguiente paso
        }}
      >
        Continuar
      </button>
    </div>
  </div>
</Modal>

<Modal
  title="Guardar plantilla"
  isOpen={isSelectProjectOpen}
  onClose={() => setSelectProjectOpen(false)}
  width={600}
  variant={modalVariant}
>
  <div style={{ display: 'grid', gap: 16, color: 'black' }}>
    {/* Paso 1: elegir proyecto existente */}
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        1) Selecciona un proyecto
      </div>

      <div
        style={{
          maxHeight: 200,
          overflow: 'auto',
          border: '1px solid rgba(0,0,0,.1)',
          borderRadius: 8,
          padding: 8,
          background: '#fff'
        }}
      >
        {projects.length === 0 ? (
          <div style={{ fontSize: 13, opacity: .7 }}>Aún no hay proyectos.</div>
        ) : projects.map(p => (
          <label
            key={p._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 4px',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name="proj"
              checked={selectedProjectId === p._id}
              onChange={() => { 
                setSelectedProjectId(p._id);
                setSelectedProjectName(p.name);
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, opacity: .6 }}>
                {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Renombrar */}
      

      
          </label>
        ))}
      </div>
    </div>


    {/* Paso 2: nombre del lugar */}
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        2) ¿Dónde va esta placa dentro del proyecto “{selectedProjectName || '—'}”?
      </div>
      <input
        type="text"
        placeholder="Ej: Habitación 101, Sala Principal, Lobby..."
        value={labelInput}
        onChange={(e) => setLabelInput(e.target.value)}
        style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 15,
          width: '100%',
        }}
      />
    </div>

    {/* Acciones */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10
      }}
    >
      <button
        className={styles.smallButton2}
        onClick={() => setSelectProjectOpen(false)}
      >
        Cancelar
      </button>
      <button
        className={styles.smallButton}
        onClick={saveTemplateNow}
      >
        Guardar
      </button>
    </div>
  </div>
</Modal>



      <div className={styles.logo}>
        <img src={logoDiseven} className={styles.imgLogo}/>
      </div>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>

<h4 className={styles.sectionTitle}>Tipo de placa</h4>
<div className={styles.toggleRow}>
  {/* Sencilla */}
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${plateMode==='sencilla' ? styles.active : ''}`}
    onClick={() => { setPlateMode('sencilla'); setActiveArea('single'); resetAll(); }}
    aria-pressed={plateMode==='sencilla'}
    title="Suiches (sencilla)"
  > 
    <img src="/assets/suichesSencillo/suiche2.png" alt="" className={styles.plateIcon} draggable={false} />
  </button>

  {/* Doble */}
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${plateMode==='doble' ? styles.active : ''}`}
    onClick={() => { setPlateMode('doble'); setActiveArea('left'); resetAll(); }}
    aria-pressed={plateMode==='doble'}
    title="Carcasa doble"
  >
    <img src="/assets/carcasas doble/carcasa2.png" alt="" className={styles.plateIcon} draggable={false} />
   
    {/* <span className={styles.btnLabel}>Doble</span> */}
  </button>
</div>

<hr />

      <h4 className={styles.sectionTitle}>Estilo del suiche</h4>
<button
  type="button"
  className={styles.previewButton2}
  onClick={() => setSuicheModalOpen(true)}
  aria-label="Elegir estilo de suiche"
  title="Elegir estilo de suiche"
>
  <div className={styles.thumbStrip}>
    {/* Mini preview del suiche actual */}
    <img
      src={selectedSuiche}
      alt="Suiche seleccionado"
      className={styles.thumbMini}
      draggable={false}
    />
    {/* Debajo de la imagen del preview */}
<span className={styles.previewCaption}>
  {(Object.values(dataSuiche).find(s => s.image === selectedSuiche)?.label) || 'Suiche'}
</span>

  </div>
  <span className={styles.previewChevron} aria-hidden>›</span>
</button>

    {/* Toolbar de colores: swatches circulares */}
                <div className={styles.canvasToolbar}>
                    <span className={styles.toolbarLabel}>Color de fondo</span>
                  <div className={styles.toolbarGroup}>
                    <div className={styles.swatchesRow}>
                      {[
                        { hex: '#FFFFFF', label: 'Blanco' },
                        { hex: '#000000', label: 'Negro' },
                      ].map(({ hex, label }) => {
                        const isActive = selectedColor === hex;
                        return (
                          <div key={hex} className={styles.swatchItem}>
                            <button
                            onClick={() => { setSelectedColor(hex) }}
                              className={`${styles.swatchCircle} ${isActive ? styles.swatchCircleActive : ''}`}
                              style={{ backgroundColor: hex }}
                              aria-label={`Color ${label}`}
                              title={label}
                            />
                            <span className={styles.swatchText}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
<h4 className={styles.sectionTitle}>Plantilla</h4>
<button
  className={styles.previewButton}
  onClick={() => setPlantillasModalOpen(true)}
  aria-label="Elegir plantilla"
  title="Elegir plantilla"
>
  <div className={styles.thumbStrip}>
    {PREVIEW_PLANTILLAS.map((id) => (
     <img
  src={getPlantillaPath(id)}
  alt={`Plantilla ${id}`}
  className={`${styles.thumbMini} ${styles.thumbMiniPlantilla}`}
  draggable={false}
/>
    ))}
  </div>
  <span className={styles.previewChevron} aria-hidden>›</span>
</button>



   {/* REPLACE: sección Iconos */}
<h4 className={styles.sectionTitle}>Iconos</h4>
<button
  className={styles.previewButton}
  onClick={() => setIconsModalOpen(true)}
  aria-label="Elegir iconos"
  title="Elegir iconos"
>
  <div className={styles.thumbStrip}>
    {PREVIEW_ICONOS.map((num) => (
      <img
        key={num}
        src={getIconPath(num)}
        alt={`Icono ${num}`}
        className={styles.thumbMiniIcon}
        draggable={false}
      />
    ))}
  </div>
 
</button>
<div>
  
{selectedIconId && (
  <div style={{ marginTop: 12, display: 'flex', gap: 7, flexDirection :"column"}}>
    <span style={{ fontSize: 12, opacity: 0.8 }}>Texto del icono:</span>
<div> <input
  ref={labelInputRef}
  value={labelInput}
  onChange={(e) => setLabelInput(e.target.value)}
  onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); }}
  placeholder="Texto del icono…"
  style={{ padding: '6px 8px', fontSize: 16, width: 130 }} />

    <button className={styles.smallButton2} onClick={saveLabel}>Guardar</button></div>
  </div>
)}
</div>



         
        </aside>

        <main className={styles.mainArea}>
           {/* Botón Reset Iconos */}

          <div className={styles.workbench}>
            
            <div className={styles.canvasPane}>
             <div ref={canvasHostRef} className={styles.canvasCard}>
    <Stage
    ref={stageRef}
    width={DESIGN_W}
    height={DESIGN_H}
    scale={{ x: scale, y: scale }}
    style={{ width: hostSize.w, height: hostSize.h, touchAction: 'none' }} // <- clave en iOS
    onPointerDown={handleStagePointerDown}>

    <Layer>
    {/* Carcasa */}
    {plateMode === 'sencilla' && carcasaSingle && (
      <>
      { carcasaSingle && (
        <KonvaImage image={carcasaSingle} x={200} y={40} width={785} height={785} className={styles.carcasa} />
       )}
      
      <Rect
        x={SINGLE_PLATE.x} y={SINGLE_PLATE.y}
        width={SINGLE_PLATE.w} height={SINGLE_PLATE.h}
        fill={selectedColor} cornerRadius={15}
      />
    
        {selectedPlantillaSingle !== '04' && plantillaSingle && (
          <KonvaImage
            image={plantillaSingle}
            x={SINGLE_PLATE.x} y={SINGLE_PLATE.y}
            width={SINGLE_PLATE.w} height={SINGLE_PLATE.h}
          />
        )}
        {/* Slots + selección de slot (ocultos cuando exportas) */}
      {slotsSingle.map((s, i) => (
        <Rect
          key={`single-${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          cornerRadius={12}
          listening
          onClick={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }}
          onTap={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }}
          stroke={activeArea === 'single' && i === activeSlotIdx ? '#0ea5e9' : undefined}
          strokeWidth={activeArea === 'single' && i === activeSlotIdx ? 2 : 0}
          shadowBlur={activeArea === 'single' && i === activeSlotIdx ? 6 : 0}
        />
      ))}


        {iconsSingle.map(icon => (
          <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}
      </>
    )}

    {plateMode === 'doble' && carcasaDoble && (
      <>
        <KonvaImage image={carcasaDoble} x={200} y={40} width={785} height={785} />

        {/* IZQUIERDA */}
        <Rect x={DOUBLE_PLATE_LEFT.x} y={DOUBLE_PLATE_LEFT.y} width={DOUBLE_PLATE_LEFT.w} height={DOUBLE_PLATE_LEFT.h} fill={selectedColor} cornerRadius={15}/>
       {selectedPlantillaLeft !== '04' && plantillaLeft && (
          <KonvaImage image={plantillaLeft} x={DOUBLE_PLATE_LEFT.x} y={DOUBLE_PLATE_LEFT.y} width={DOUBLE_PLATE_LEFT.w} height={DOUBLE_PLATE_LEFT.h}/>
          )}
          { slotsLeft.map((s, i) => (
            <Rect
              key={`left-${i}`}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              cornerRadius={12}
              listening
              onClick={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}
              onTap={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}
              stroke={activeArea === 'left' && i === activeSlotIdx ? '#0ea5e9' : undefined}
              strokeWidth={activeArea === 'left' && i === activeSlotIdx ? 2 : 0}
              shadowBlur={activeArea === 'left' && i === activeSlotIdx ? 6 : 0}
            />
          ))}
        {iconsLeft.map(icon => (
          <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}

        {/* DERECHA */}
        <Rect x={DOUBLE_PLATE_RIGHT.x} y={DOUBLE_PLATE_RIGHT.y} width={DOUBLE_PLATE_RIGHT.w} height={DOUBLE_PLATE_RIGHT.h} fill={selectedColor} cornerRadius={15}/>
       {selectedPlantillaRight !== '04' && plantillaRight && (
          <KonvaImage image={plantillaRight} x={DOUBLE_PLATE_RIGHT.x} y={DOUBLE_PLATE_RIGHT.y} width={DOUBLE_PLATE_RIGHT.w} height={DOUBLE_PLATE_RIGHT.h}/>
        )}

{ slotsRight.map((s, i) => (
  <Rect
    key={`right-${i}`}
    x={s.x}
    y={s.y}
    width={s.w}
    height={s.h}
    cornerRadius={12}
    listening
    onClick={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}
    onTap={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}
    stroke={activeArea === 'right' && i === activeSlotIdx ? '#0ea5e9' : undefined}
    strokeWidth={activeArea === 'right' && i === activeSlotIdx ? 2 : 0}
    shadowBlur={activeArea === 'right' && i === activeSlotIdx ? 6 : 0}
  />
))}
        {iconsRight.map(icon => (
          <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}
      </>
    )}
  </Layer>
</Stage>

{editingIconId && (
  <input
    ref={overlayInputRef}
    style={{
      position: 'fixed',
      top: editPos.y,
      left: editPos.x,
      width: editWidth,
      fontSize: 16,               // <- importante en iPad
      padding: '2px 4px',
      border: '1px solid #ccc',
      borderRadius: 4,
      zIndex: 9999,
      outline: 'none',
      background: '#fff'
    }}
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={handleSaveEdit}
    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
  />
)}

              </div>


            </div>

          </div>
        </main>
      </div>

     <Modal title="Elegir plantilla" isOpen={isPlantillasModalOpen} onClose={() => setPlantillasModalOpen(false)}  variant={modalVariant}>


<div className={styles.plantillaGrid}>
  {plantillaIds.map((id) => {
    const src = getPlantillaPath(id);

    // activo según el área/placa actual
    const isActive =
      plateMode === 'sencilla'
        ? selectedPlantillaSingle === id
        : (activeArea === 'left' ? selectedPlantillaLeft === id : selectedPlantillaRight === id);

    return (
      <button
        key={`${id}-${themeKey}`}
        onClick={() => {
          if (plateMode === 'sencilla') setSelectedPlantillaSingle(id);
          else if (activeArea === 'left') setSelectedPlantillaLeft(id);
          else if (activeArea === 'right') setSelectedPlantillaRight(id);
          setPlantillasModalOpen(false);
        }}
        className={`${styles.plantillaBtn} ${isActive ? styles.plantillaBtnActive : ''}`}
        title={`Plantilla ${id}`}
      >
        <img
          src={src}
          alt={`Plantilla ${id}`}
          className={`${
            themeKey === 'dark' ? styles.plantillaThumbDark : styles.plantillaThumbLight
          }`}
        />
      </button>
    );
  })}
</div>

</Modal>


      
<Modal
  title="Elegir iconos"
  isOpen={isIconsModalOpen}
  onClose={() => setIconsModalOpen(false)}
  width={780}
  variant={modalVariant}
>
  {/* Tabs de categorías */}
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
    {Object.keys(ICON_CATEGORIES).map((cat) => {
      const active = selectedCategory === cat;
      return (
        <button
          key={cat}
          onClick={() => { setSelectedCategory(cat); setIconSearch(''); }}
          className={`${styles.smallButton} ${active ? styles.active : ''}`}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: active ? '1px solid #0ea5e9' : '1px solid #ddd',
            background: active ? '#e6f6fe' : (modalVariant === 'dark' ? '#111' : '#fff'),
            color: modalVariant === 'dark' ? '#fff' : '#111'
          }}
          title={cat}
        >
          {cat}
        </button>
      );
    })}
  </div>



  {/* Grid de iconos filtrados */}
  <div
    className={`${styles.iconGridSide} ${
      modalVariant === 'dark' ? styles.lightBody : styles.darkBody
    }`} 
   
  >
    {(() => {
      const baseList = selectedCategory === 'Todos'
        ? iconNumbers
        : (ICON_CATEGORIES[selectedCategory] || []);

      const q = iconSearch.trim();
      const filtered = q ? baseList.filter(num => num.includes(q)) : baseList;

      if (!filtered.length) {
        return (
          <div style={{ gridColumn: '1 / -1', opacity: 0.7, fontSize: 14 }}>
            Sin resultados en <b>{selectedCategory}</b>{q && <> para “{q}”</>}.
          </div>
        );
      }

      return filtered.map((num) => {
        const label = num; // si más adelante usas metadatos, cambia esto
        return (
          <button
            key={`${selectedCategory}-${num}`}
            onClick={() => { placeOrReplaceIcon(num, label); setIconsModalOpen(false); }}
            className={styles.iconoButton}
            title={`Icono ${num}`}
          >
            <img
              src={getIconPath(num)}
              alt={`Icono ${num}`}
              className={`${themeKey === 'dark' ? styles.iconoMiniaturaDark : styles.iconoMiniaturaLigh}`}
              draggable={false}
            />
            <div className={styles.iconoMiniaturaTexto}>{label}</div>
          </button>
        );
      });
    })()}
  </div>
</Modal>


  <Modal
    title="Elegir estilo de suiche"
    isOpen={isSuicheModalOpen}
    onClose={() => setSuicheModalOpen(false)}
    width={780}
    variant={modalVariant}
  >
  <div
    className={`${styles.suicheList} ${
      modalVariant === 'dark' ? styles.lightBody : styles.darkBody
    }`}
 
  >
    {Object.entries(dataSuiche).map(([key, value], i) => {
      const extraClass = value.cssClass ? styles[value.cssClass] : '';
      const isActive = selectedSuiche === value.image;

      return (
        <button
          key={key}
          onClick={() => {
            // Selecciona el suiche
            setSelectedSuiche(value.image);

 
            if (plateMode === 'doble') {
              setSelectedCarcasaDoble(`/assets/carcasas doble/carcasa${i + 1}.png`);
            }

            setSuicheModalOpen(false);
          }}
          className={`${styles.suicheButton} ${extraClass} ${isActive ? styles.active : ''}`}
          style={!value.cssClass ? { backgroundColor: value.color } : {}}
          title={value.label ?? key}
        >
          {/* Vista del acabado */}
          {/* Etiqueta */}
        {value.label && <span className={styles.suicheLabel}>{value.label}</span>}
        </button>
      );
    })}
  </div>
</Modal>

    </div>
  );
};

export default DesignerCanvas;
