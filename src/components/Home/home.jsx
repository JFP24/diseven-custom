// src/components/Home/home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./home.module.css";

const imgHome = "/assets/imgHome/suiches.jpg";
const logoBlue = "/assets/imgHome/logoDiseven.png";   // PNG sobre fondo oscuro
const logoDark = "/assets/imgHome/logo_negro.png";     // (opcional) para fondos claros

export default function Home() {
  // Intro solo la primera visita de la sesión (cámbialo a localStorage si quieres “solo 1 vez por navegador”)
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("home-intro"));
  useEffect(() => {
    if (showIntro) {
      const t = setTimeout(() => {
        sessionStorage.setItem("home-intro", "1");
        setShowIntro(false);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [showIntro]);

  return (
    <>
      {/* Top bar con logo */}
      <header className={styles.nav}>
      <div className={styles.brand}>
  <div className={styles.logoWrap}>
    <img src={logoBlue} alt="DISEVEN" className={styles.logoImg}/>
  </div>
</div>
        {/* <nav className={styles.navLinks}>
          <Link to="/designer">Diseñador</Link>
          <a href="/catalogo.pdf" target="_blank" rel="noreferrer">Catálogo</a>
        </nav> */}
      </header>

      {/* Hero */}
      <div className={styles.hero}>
        <AnimatePresence>{showIntro && <IntroOverlay />}</AnimatePresence>

        {/* Fondo con reveal premium */}
        <motion.div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${imgHome})` }}
          initial={{ scale: 1.06, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
        />

        {/* Marca sutil (watermark) */}
        {/* <motion.img
          src={logoBlue}
          alt="DISEVEN"
          className={styles.heroBadge}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 0.75, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        /> */}

        {/* Contenido */}
        <div className={styles.heroInner}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            Ilumina con elegancia
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Placas táctiles premium con acabados en negro, blanco, titanio y oro cepillado.
          </motion.p>

          <motion.div
            className={styles.ctaRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Link to="/designer" className={styles.btnPrimary}>Diseñar mi placa</Link>
            <a href="/catalogo.pdf" className={styles.btnGhost}>Ver catálogo</a>
          </motion.div>
        </div>
      </div>

      {/* Sección dividida */}
      <section className={styles.split}>
        <div className={styles.splitText}>
          <h2>Control táctil con look arquitectónico</h2>
          <p>
            DISEVEN integra diseño y tecnología: interfaces capacitivas, tipografía grabada y
            materiales nobles para espacios de alto estándar.
          </p>
          <ul className={styles.bullets}>
            <li>Iconografía minimal y retroiluminación uniforme</li>
            <li>Layouts modulares (1 a 8 áreas táctiles)</li>
            <li>Compatibles con tus escenarios y escenas favoritas</li>
          </ul>
          <div className={styles.splitCtas}>
            <Link to="/designer" className={styles.btnPrimary}>Probar el diseñador</Link>
            <a className={styles.link} href="/catalogo.pdf">Descargar ficha técnica</a>
          </div>
        </div>
        <div className={styles.splitMedia}>
          <div className={styles.mediaCard} style={{ backgroundImage: `url(${imgHome})` }} />
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <article className={styles.featureCard}>
            <h3>Respuesta precisa</h3>
            <p>Sensores táctiles calibrados y feedback visual inmediato.</p>
          </article>
          <article className={styles.featureCard}>
            <h3>Durabilidad real</h3>
            <p>Frentes metálicos y acabados que resisten el uso diario.</p>
          </article>
          <article className={styles.featureCard}>
            <h3>Instalación limpia</h3>
            <p>Compatibles con cajas estándar y cableado existente.</p>
          </article>
        </div>
      </section>

      {/* Materiales */}
      <section className={styles.materials}>
        <h2>Acabados disponibles</h2>
        <p className={styles.materialsSub}>Sobrios, atemporales y combinables.</p>
        <div className={styles.swatches}>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotWhite}`} /> Blanco</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotBlack}`} /> Negro</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotNickel}`} /> Níquel</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotGold}`} /> Oro cepillado</div>
        </div>
     
      </section>

      {/* Cierre con logo
   <footer className={styles.footer}>
  <div className={styles.footerBrand}>
    <div className={styles.logoWrapSm}>
      <img src={logoBlue} alt="DISEVEN" className={styles.logoImg}/>
    </div>
  </div>
</footer> */}
    </>
  );
}

function IntroOverlay() {
  return (
    <motion.div
      className={styles.intro}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <motion.div
        className={styles.introCard}
        initial={{ scale: 0.96, filter: "blur(6px)", opacity: 0 }}
        animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
        exit={{ scale: 1.02, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      >
        <img src={logoBlue} alt="DISEVEN — Innovación tecnológica" className={styles.introLogo} />
        <motion.span
          className={styles.goldBar}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
        />
      </motion.div>
    </motion.div>
  );
}
