import { Stage, Layer, Image as KonvaImage, Rect, Group, Text } from 'react-konva';
import useImage from 'use-image';
import React ,{ useEffect, useRef, useState, useCallback } from 'react';
import styles from './diseñoCanvas.module.css';
const reloadIcon = "/assets/ICONOS/icono-reload.png";
const logoDiseven = "/assets/imgHome/disevenhome.png";

// Reemplaza la firma y el useImage:
// Reemplaza TU IconWithLabel completo por este:
// REPLACE la firma y el Group de IconWithLabel:
const IconWithLabel = ({
  x, y, size, src, label, isWhite, glowOn = true,
  glowBlur = 18, glowOpacity = 0.45, onSelect // <- NUEVO
}) => {
  const [iconImg] = useImage(src);
  if (!iconImg) return null;

  const fontSize = Math.min(14, Math.max(12, Math.round(size * 0.22)));
  const labelGap = 6;

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
        height={size}
        shadowOpacity={glowOpacity}
        shadowOffset={{ x: 0, y: 0 }}
      />
      <Text
        x={0}
        y={size + labelGap}
        width={size}
        text={label ?? ''}
        fontSize={fontSize}
        fill={isWhite ? '#FFFFFF' : '#000000ff'}
        align="center"
        opacity={1}
        shadowEnabled={glowOn}
        shadowBlur={Math.round(glowBlur * 0.6)}
        shadowOpacity={Math.min(1, glowOpacity * 0.8)}
        shadowOffset={{ x: 0, y: 0 }}
      />
    </Group>
  );
};





const dataSuiche = {

  suiche1: { color: '#FFFFFF', image: '/assets/suichesSencillo/suiche.png' , label: 'White'  },
  suiche2: { color: '#000000', image: '/assets/suichesSencillo/suiche2.png', label: 'Black' },
  suiche3: { color: '#3A2C28', image: '/assets/suichesSencillo/suiche3.png' , label: 'Brown'},
  suiche4: { image: '/assets/suichesSencillo/suiche4.png', cssClass: 'brushed', label: 'Brushed Black' },
  suiche5: { image: '/assets/suichesSencillo/suiche5.png', cssClass: 'brushedGold', label: 'Brushed Gold' },
  suiche6: { image: '/assets/suichesSencillo/suiche6.png', cssClass: 'brushedGray', label: 'Brushed Gray' },
  suiche7: { image: '/assets/suichesSencillo/suiche7.png', cssClass: 'brushedAlmond', label: 'Brushed Light Almond' },
  suiche8: { image: '/assets/suichesSencillo/suiche8.png', cssClass: 'brushedNickel', label: 'Brushed Nickel' },
  suiche9: { image: '/assets/suichesSencillo/suiche9.png', cssClass: 'brushedSilver', label: 'Brushed Silver' },
  suiche10: { image: '/assets/suichesSencillo/suiche10.png', cssClass: 'brushedTitanium', label: 'Brushed Titanium' },
  suiche11: { image: '/assets/suichesSencillo/suiche11.png', cssClass: 'brushedWhite', label: 'Brushed White' },
  suiche12: { color: '#D49A06', image: '/assets/suichesSencillo/suiche12.png', label: 'Gold ' },
  suiche13: { color: '#818181', image: '/assets/suichesSencillo/suiche13.png', label: 'Gray' },
  suiche14: { color: '#cbc6a3', image: '/assets/suichesSencillo/suiche14.png', label: 'Ivory' },
  suiche15: { color: '#ece8d2', image: '/assets/suichesSencillo/suiche15.png', label: 'Light Almond' },
  suiche16: { color: '#a4948e', image: '/assets/suichesSencillo/suiche16.png', label: 'Nickel' },
  suiche17: { color: '#D3D3D3', image: '/assets/suichesSencillo/suiche17.png', label: 'Silver' },
  suiche18: { color: '#504f4e', image: '/assets/suichesSencillo/suiche18.png', label: 'Space Gray' },
  suiche19: { color: '#d4af37ff', image: '/assets/suichesSencillo/suiche19.png', label: 'Acrylic  Gold' },
  suiche20: { color: '#d1a38aff', image: '/assets/suichesSencillo/suiche20.png', label: 'Acrylic Rose Gold' },
  suiche21: { color: '#b1b1b1ff', image: '/assets/suichesSencillo/suiche21.png', label: 'Acrylic Silver' },

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
  '231','232','233','234','235','236','237'
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


const isInsidePlate = (x, y) =>
  x >= PL_X && x <= PL_X + PL_W && y >= PL_Y && y <= PL_Y + PL_H;



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


const DesignerCanvas = () => {

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
  console.log(selectedColor)
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



  const slots = getSlotsFor(getSlotsKey(selectedPlantilla));

  const [icons, setIcons] = useState([]); // {id, src, label, slotIdx, x,y,w,h}
  const [selectedIconId, setSelectedIconId] = useState(null);
//  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

const [editingIconId, setEditingIconId] = useState(null);
const [editValue, setEditValue] = useState('');
const [editPos, setEditPos] = useState({ x: 0, y: 0 });
const [editWidth, setEditWidth] = useState(0);


const [isSuicheModalOpen, setSuicheModalOpen] = useState(false);



const resetArea = (area) => {
  if (area === 'single') { setIconsSingle([]); setActiveArea('single'); }
  if (area === 'left')   { setIconsLeft([]);   setActiveArea('left'); }
  if (area === 'right')  { setIconsRight([]);  setActiveArea('right'); }
  setActiveSlotIdx(null);
  setSelectedIconId(null);
  setEditingIconId(null);
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

  const stageRef = useRef(null);

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

  return (
    <div className={styles.contenedor}>
        {/* <div className={styles.header}>
        <img
          src={"https://developer-appv2.s3.us-east-1.amazonaws.com/icons/casa-hogar-home-cabaña-exterior.gif"}
          className={styles.casaR}
        />
        </div> */}
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
  style={{ padding: '6px 8px', fontSize: 16, width: 130 }} // <- 16px ayuda en iOS
/>

    <button className={styles.smallButton} onClick={saveLabel}>Guardar</button></div>
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
        <KonvaImage image={carcasaSingle} x={200} y={40} width={785} height={785} className={styles.carcasa} />
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

        {/* Slots + selección de slot */}
    {slotsSingle.map((s, i) => (
  <Rect
    key={`single-${i}`}
    x={s.x} y={s.y} width={s.w} height={s.h} cornerRadius={12}
    listening
    onClick={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }}
      onTap={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }} // <- ADD

    stroke={activeArea==='single' && i===activeSlotIdx ? '#0ea5e9' : undefined}
    strokeWidth={activeArea==='single' && i===activeSlotIdx ? 2 : 0}
    shadowBlur={activeArea==='single' && i===activeSlotIdx ? 6 : 0}
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
 {slotsLeft.map((s, i) => (
  <Rect
    key={`left-${i}`}
    x={s.x} y={s.y} width={s.w} height={s.h} cornerRadius={12}
    listening
    onClick={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}
onTap={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}

    stroke={activeArea==='left' && i===activeSlotIdx ? '#0ea5e9' : undefined}
    strokeWidth={activeArea==='left' && i===activeSlotIdx ? 2 : 0}
    shadowBlur={activeArea==='left' && i===activeSlotIdx ? 6 : 0}
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
    {slotsRight.map((s, i) => (
  <Rect
    key={`right-${i}`}
    x={s.x} y={s.y} width={s.w} height={s.h} cornerRadius={12}
    listening
// RIGHT (fix)
onClick={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}
onTap={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}


    stroke={activeArea==='right' && i===activeSlotIdx ? '#0ea5e9' : undefined}
    strokeWidth={activeArea==='right' && i===activeSlotIdx ? 2 : 0}
    shadowBlur={activeArea==='right' && i===activeSlotIdx ? 6 : 0}
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
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, minmax(64px, 1fr))',
      gap: 12,
      alignItems: 'start'
    }}
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
    style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(72px, 1fr))', gap: 16 }}
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

            // Si tu flujo lo requiere, puedes forzar color de fondo según el suiche:
            // if (value.color) setSelectedColor(value.color);

            // Si está en modo doble, sincroniza la carcasa doble por índice
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
          <div className={styles.suicheIcon} />
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
