// src/components/Home/home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./home.module.css";
import { useAuth } from "../../auth/AuthContext.jsx";
import { usePrefs } from "../../i18n/PrefsContext.jsx";
import PrefsToggle from "../PrefsToggle.jsx";

const imgHome = "/assets/imgHome/suiches.jpg";
const logoBlue = "/assets/imgHome/logoDiseven.png";

export default function Home() {
  const { ready } = useAuth();
  const { t } = usePrefs();

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

  if (!ready) {
    return (
      <div className={styles.hero} style={{ display: "grid", placeItems: "center" }}>
        <img src={logoBlue} alt="DISEVEN" className={styles.footerLogo} />
      </div>
    );
  }

  return (
    <>
      <PrefsToggle className={styles.prefsFloat} />

      {/* Hero */}
      <div className={styles.hero}>
        <AnimatePresence>{showIntro && <IntroOverlay />}</AnimatePresence>

        <motion.div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${imgHome})` }}
          initial={{ scale: 1.06, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
        />

        <div className={styles.heroInner}>
          <motion.span
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {t("home.eyebrow")}
          </motion.span>

          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {t("home.titlePre")}<em>{t("home.titleEm")}</em>
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {t("home.subtitle")}
          </motion.p>

          <motion.div
            className={styles.ctaRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Link to="/designer" className={styles.btnPrimary}>
              {t("home.designCta")}
            </Link>
            <a href="/catalogo.pdf" className={styles.btnGhost}>{t("home.viewCatalog")}</a>
          </motion.div>
        </div>
      </div>

      {/* Split */}
      <section className={styles.split}>
        <div className={styles.splitText}>
          <h2>{t("home.splitTitle")}</h2>
          <p>{t("home.splitP")}</p>
          <ul className={styles.bullets}>
            <li>{t("home.bullet1")}</li>
            <li>{t("home.bullet2")}</li>
            <li>{t("home.bullet3")}</li>
          </ul>
          <div className={styles.splitCtas}>
            <Link to="/designer" className={styles.btnPrimary}>
              {t("home.tryDesigner")}
            </Link>
            <a className={styles.link} href="/catalogo.pdf">{t("home.downloadSheet")}</a>
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
            <h3>{t("home.f1t")}</h3>
            <p>{t("home.f1p")}</p>
          </article>
          <article className={styles.featureCard}>
            <h3>{t("home.f2t")}</h3>
            <p>{t("home.f2p")}</p>
          </article>
          <article className={styles.featureCard}>
            <h3>{t("home.f3t")}</h3>
            <p>{t("home.f3p")}</p>
          </article>
        </div>
      </section>
   <section className={styles.materials}>
        <h2>{t("home.materialsTitle")}</h2>
        <p className={styles.materialsSub}>{t("home.materialsSub")}</p>
        <div className={styles.swatches}>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotWhite}`} /> {t("home.mWhite")}</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotBlack}`} /> {t("home.mBlack")}</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotNickel}`} /> {t("home.mNickel")}</div>
          <div className={styles.swatch}><span className={`${styles.dot} ${styles.dotGold}`} /> {t("home.mGold")}</div>
        </div>
      </section>
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
        <img src="/assets/imgHome/logoDiseven.png" alt="DISEVEN — Innovación tecnológica" className={styles.introLogo} />
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




   