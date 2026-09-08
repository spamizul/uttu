import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";
import { Store, Layers, Ruler, Shirt, Plus, X, Search, Trash2, Pencil, Check, Zap, CircleAlert, WifiOff, ShoppingBasket, Wand2, Eye, EyeOff, Tag, CalendarClock, SlidersHorizontal, Archive, Camera, CircleCheckBig, Heart, List, LayoutGrid, Sun, Moon } from "lucide-react";

/* ------------------------------------------------------------------ */
const THEMES = {
  clair: {
    page: "#F6F5F0", ground: "#EDECE5", surface: "#FBFAF6",
    ink: "#17170F", inkSoft: "#7C8B9E", faible: "#A8B2BE",
    line: "#E1E0D7", pointille: "#A9B6C6", encre: "#2B4C7E",
    alerte: "#8A3A2E", voile: "rgba(23,23,15,.45)",
  },
  sombre: {
    page: "#0F0E0C", ground: "#1C1913", surface: "#17150F",
    ink: "#F0E7D8", inkSoft: "#8A7C66", faible: "#5E5344",
    line: "#262019", pointille: "#3A3227", encre: "#C98F3E",
    alerte: "#C4705A", voile: "rgba(0,0,0,.62)",
  },
};

// C est muté au rendu selon l'ambiance choisie
const C = { ...THEMES.clair };
Object.defineProperties(C, {
  bleu: { get() { return C.ink; } },
  accent: { get() { return C.ink; } },
  ok: { get() { return C.ink; } },
  fil: { get() { return C.ground; } },
  tampon: { get() { return C.alerte; } },
});

const MONO = 'ui-monospace, Menlo, "SF Mono", Consolas, monospace';
const SANS = '"Bricolage Grotesque", -apple-system, BlinkMacSystemFont, sans-serif';
const mono = (fontSize, color = C.inkSoft, letterSpacing = ".08em") => ({ fontFamily: MONO, fontSize, color, letterSpacing });
const ref = (i, prefixe = "") => prefixe + String(i + 1).padStart(3 - prefixe.length, "0");

const COUSU = "déjà cousu";

const MATIERES = ["Coton", "Popeline", "Jersey", "Sweat", "Lin", "Viscose", "Denim", "Laine", "Satin", "Velours", "Autre"];
const CATEGORIES = ["Haut", "Chemise", "Robe", "Jupe", "Pantalon", "Veste", "Manteau", "Accessoire", "Déco", "Autre"];
const COULEURS = ["#1D2A38", "#2E5A8A", "#6E9BC5", "#A8C4D9", "#3F6B4E", "#8AA88C", "#D9A21C", "#C96A4B", "#9C3B3B", "#D98BA0", "#E8E2D6", "#FFFFFF", "#7C6E8C", "#4A4A4A", "#B5A98F", "#000000"];

const TYPES_MERCERIE = ["Fil", "Boutons", "Fermeture", "Élastique", "Biais", "Ruban", "Thermocollant", "Autre"];

const MERCERIE_SEED = [
  { id: 1, type: "Fil", nom: "Gütermann bleu nuit", couleur: "#1D2A38", quantite: "2 bobines", notes: "" },
  { id: 2, type: "Boutons", nom: "Nacre 15 mm", couleur: "#E8E2D6", quantite: "12", notes: "Récupérés sur une vieille chemise." },
  { id: 3, type: "Boutons", nom: "Bois foncé 18 mm", couleur: "#4A4A4A", quantite: "5", notes: "" },
  { id: 4, type: "Fermeture", nom: "Invisible 20 cm", couleur: "#9C3B3B", quantite: "1", notes: "" },
  { id: 5, type: "Biais", nom: "Coton moutarde 20 mm", couleur: "#D9A21C", quantite: "3 m", notes: "" },
];

const TISSUS_SEED = [
  { id: 1, nom: "Sergé moutarde", matiere: "Coton", couleur: "#D9A21C", laize: 145, metrage: 2.4, boutique: "Les Coupons de Saint-Pierre", prix: 9.9, notes: "" },
  { id: 2, nom: "Lin lavé bleu nuit", matiere: "Lin", couleur: "#1D2A38", laize: 140, metrage: 3.1, boutique: "Mondial Tissus", prix: 16.5, notes: "" },
  { id: 3, nom: "Jersey rayé", matiere: "Jersey", couleur: "#6E9BC5", laize: 160, metrage: 1.2, boutique: "Fil de temps", prix: 12, notes: "" },
  { id: 4, nom: "Denim brut", matiere: "Denim", couleur: "#2E5A8A", laize: 150, metrage: 1.8, boutique: "", prix: 14.9, notes: "" },
  { id: 5, nom: "Popeline fleurie", matiere: "Popeline", couleur: "#D98BA0", laize: 145, metrage: 0.8, boutique: "Marché des Lices", prix: 7, notes: "" },
];

const PATRONS_SEED = [
  { id: 1, nom: "Cherry Hills", marque: "Deer & Doe", categorie: "Veste", metrage: 1.8, laize: 145, taille: "38", tags: ["mi-saison"], fournitures: [{ q: "6", l: "boutons" }, { q: "1", l: "fermeture 20 cm" }], notes: "Rallonger de 10 cm." },
  { id: 2, nom: "Chemise Fibule", marque: "Ready to Sew", categorie: "Chemise", metrage: 2.2, laize: 140, taille: "M", tags: ["léger", "été"], fournitures: [{ q: "9", l: "boutons" }], notes: "" },
  { id: 3, nom: "Pantalon Sirocco", marque: "Anna Rose", categorie: "Pantalon", metrage: 2.6, laize: 145, taille: "", tags: ["vacances"], fournitures: [{ q: "1", l: "fermeture 18 cm" }, { q: "1", l: "élastique 3 cm" }], notes: "" },
  { id: 4, nom: "T-shirt Plantain", marque: "Deer & Doe", categorie: "Haut", metrage: 1.1, laize: 160, taille: "38", tags: [COUSU, "léger"], fournitures: [], notes: "Emmanchures un peu justes, prendre le 40." },
];

const TAGS_SEED = [COUSU, "été", "léger", "vacances", "fête", "mi-saison"];

// "déjà cousu" passe toujours en tête, les autres gardent leur ordre
const tagsTries = (t = []) => [...t].sort((a, b) => (a === COUSU ? -1 : b === COUSU ? 1 : 0));

const fmtM = (n) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
const fmtE = (n) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const arr = (n) => (Math.ceil(n * 10) / 10).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* --------- échéances ---------- */
const joursRestants = (iso) => {
  if (!iso) return null;
  const a = new Date(iso + "T00:00:00");
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
};
const texteEcheance = (j) => {
  if (j === null) return "";
  if (j < -1) return `en retard de ${-j} jours`;
  if (j === -1) return "hier";
  if (j === 0) return "aujourd'hui";
  if (j === 1) return "demain";
  if (j < 31) return `dans ${j} jours`;
  const s = Math.round(j / 7);
  if (j < 90) return `dans ${s} semaines`;
  return `dans ${Math.round(j / 30)} mois`;
};
const photosDe = (o) => (o && o.photos) || (o && o.photo ? [o.photo] : []);
const lirePhotos = (fichiers, retour) => {
  Array.from(fichiers).forEach((f) => {
    const r = new FileReader();
    r.onload = () => retour(r.result);
    r.readAsDataURL(f);
  });
};

const ilYA = (iso) => {
  const j = -joursRestants(iso);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 31) return `il y a ${j} jours`;
  if (j < 365) return `il y a ${Math.round(j / 30)} mois`;
  return "il y a plus d'un an";
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");
const couleurEcheance = (j) => (j === null ? C.inkSoft : j <= 7 ? C.alerte : j <= 30 ? C.fil : C.inkSoft);

/* --- lignes de courses engendrées par un projet (recalculées quand il change) --- */
const lignesProjet = (projet, p, t) => {
  const id = projet.id;
  const base = Date.now();
  const nom = projet.nom;
  const besoin = projet.besoin;
  const manque = besoin !== null && besoin !== undefined && t ? Math.max(0, besoin - t.metrage) : 0;
  const lignes = [];

  if (!t) {
    lignes.push({ id: base + 1, projetId: id, libelle: `Tissu pour ${nom}`, quantite: besoin != null ? `${arr(besoin * 1.1)} m` : "", type: "tissu", origine: nom, fait: false, auto: true });
  } else if (manque > 0.01) {
    lignes.push({ id: base + 1, projetId: id, libelle: `Complément — ${t.nom}`, quantite: `${arr(manque)} m`, type: "tissu", origine: nom, fait: false, auto: true });
  }
  (p?.fournitures || []).forEach((f, i) => {
    if (!f.l.trim()) return;
    lignes.push({ id: base + 10 + i, projetId: id, libelle: f.l, quantite: String(f.q), type: "mercerie", origine: nom, fait: false, auto: true });
  });
  // le fil assorti n'est presque jamais écrit sur les patrons, et c'est l'oubli classique
  if (!(p?.fournitures || []).some((f) => f.l.toLowerCase().includes("fil"))) {
    lignes.push({ id: base + 2, projetId: id, libelle: t ? `Fil assorti — ${t.nom}` : "Fil assorti", quantite: "1 bobine", type: "mercerie", origine: nom, fait: false, auto: true });
  }
  return lignes;
};

/* ------------------------------------------------------------------ */

export default function App() {
  // --- test de connexion, à retirer une fois validé ---
  useEffect(() => {
    supabase.from("tissus").select("*").then(({ data, error }) => {
      console.log("Supabase →", { data, error });
    });
  }, []);

  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair"
  );
  Object.assign(C, THEMES[theme]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEMES[theme].page);
    document.body.style.background = THEMES[theme].page;
  }, [theme]);

  const [demarrage, setDemarrage] = useState(true);
  const [tab, setTab] = useState("magasin");
  const [tissus, setTissus] = useState(TISSUS_SEED);
  const [mercerie, setMercerie] = useState(MERCERIE_SEED);
  const [editMercerie, setEditMercerie] = useState(null);
  const [patrons, setPatrons] = useState(PATRONS_SEED);
  const [tags, setTags] = useState(TAGS_SEED);
  const [projets, setProjets] = useState([]);
  const [courses, setCourses] = useState([]);
  const [edit, setEdit] = useState(null);
  const [rapide, setRapide] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailPatron, setDetailPatron] = useState(null);
  const [editPatron, setEditPatron] = useState(null);
  const [detailProjet, setDetailProjet] = useState(null);
  const [envies, setEnvies] = useState([]);
  const [editEnvie, setEditEnvie] = useState(null);
  const [cloture, setCloture] = useState(null);
  const [detailArchive, setDetailArchive] = useState(null);
  const [gestionTags, setGestionTags] = useState(false);
  const [toast, setToast] = useState("");

  const annonce = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  const visibles = courses.filter((c) => !c.projetId || projets.find((p) => p.id === c.projetId)?.suivi);
  const aFaire = visibles.filter((c) => !c.fait).length;

  const save = (t) => {
    if (t.id) setTissus((p) => p.map((x) => (x.id === t.id ? t : x)));
    else setTissus((p) => [{ ...t, id: Date.now() }, ...p]);
    setEdit(null); setDetail(null);
  };
  const supprTissu = (id) => { setTissus((p) => p.filter((x) => x.id !== id)); setDetail(null); };

  const saveMercerie = (m) => {
    if (m.id) setMercerie((p) => p.map((x) => (x.id === m.id ? m : x)));
    else setMercerie((p) => [{ ...m, id: Date.now() }, ...p]);
    setEditMercerie(null);
  };
  const supprMercerie = (id) => { setMercerie((p) => p.filter((x) => x.id !== id)); setEditMercerie(null); };

  const saveRapide = (quoi, d) => {
    if (quoi === "tissu") {
      setTissus((p) => [{ ...d, id: Date.now(), aCompleter: true }, ...p]);
      if (d.courseId) setCourses((p) => p.map((c) => (c.id === d.courseId ? { ...c, fait: true } : c)));
      annonce(`${d.nom} est dans ta réserve`);
    } else if (quoi === "mercerie") {
      setMercerie((p) => [{ ...d, id: Date.now(), aCompleter: true }, ...p]);
      if (d.courseId) setCourses((p) => p.map((c) => (c.id === d.courseId ? { ...c, fait: true } : c)));
      annonce(`${d.nom} est dans ton tiroir`);
    } else {
      setPatrons((p) => [...p, { ...d, id: Date.now(), tags: [], fournitures: [], notes: "", aCompleter: !d.metrage }]);
      annonce("Patron ajouté");
    }
    setRapide(null);
  };

  const saveEnvie = (e) => {
    if (e.id) setEnvies((p) => p.map((x) => (x.id === e.id ? e : x)));
    else setEnvies((p) => [{ ...e, id: Date.now(), depuis: aujourdhui() }, ...p]);
    setEditEnvie(null);
  };
  const supprEnvie = (id) => { setEnvies((p) => p.filter((x) => x.id !== id)); setEditEnvie(null); };
  const acheterEnvie = (e) => {
    setEnvies((p) => p.filter((x) => x.id !== e.id));
    setEditEnvie(null);
    setRapide({ nom: e.nom, quoi: e.quoi });
  };

  const savePatron = (p) => {
    if (p.id) { setPatrons((prev) => prev.map((x) => (x.id === p.id ? p : x))); setDetailPatron(p); }
    else setPatrons((prev) => [...prev, { ...p, id: Date.now() }]);
    setEditPatron(null);
  };
  const supprPatron = (id) => { setPatrons((p) => p.filter((x) => x.id !== id)); setDetailPatron(null); };

  const creerTag = (t) => { if (t && !tags.includes(t)) setTags((p) => [...p, t]); };
  const renommerTag = (ancien, nouveau) => {
    const n = nouveau.trim();
    if (!n || ancien === COUSU || tags.includes(n)) return;
    setTags((p) => p.map((t) => (t === ancien ? n : t)));
    setPatrons((p) => p.map((x) => ({ ...x, tags: (x.tags || []).map((t) => (t === ancien ? n : t)) })));
  };
  const supprimerTag = (t) => {
    if (t === COUSU) return;
    setTags((p) => p.filter((x) => x !== t));
    setPatrons((p) => p.map((x) => ({ ...x, tags: (x.tags || []).filter((y) => y !== t) })));
  };

  const creerProjet = (projet, lignes) => {
    setProjets((p) => [...p, projet]);
    if (lignes.length) {
      setCourses((p) => [...p, ...lignes]);
      annonce(`${lignes.length} ligne${lignes.length > 1 ? "s" : ""} ajoutée${lignes.length > 1 ? "s" : ""} à ta liste`);
    } else annonce("Projet créé. Tu as déjà tout ce qu'il faut.");
  };
  const majProjet = (pr) => {
    const avant = projets.find((x) => x.id === pr.id);
    const pat = patrons.find((x) => x.id === pr.patronId) || null;
    const tis = tissus.find((x) => x.id === pr.tissuId) || null;
    const besoin = pat ? (tis ? (pat.metrage * pat.laize) / tis.laize : pat.metrage) : (pr.besoin ?? null);
    const maj = { ...pr, besoin };
    setProjets((p) => p.map((x) => (x.id === maj.id ? maj : x)));
    setDetailProjet(maj);
    if (avant && (avant.patronId !== maj.patronId || avant.tissuId !== maj.tissuId)) {
      setCourses((p) => [...p.filter((c) => !(c.projetId === maj.id && c.auto)), ...lignesProjet(maj, pat, tis)]);
      annonce("Liste de courses remise à jour");
    }
  };
  const supprProjet = (id) => {
    setProjets((p) => p.filter((x) => x.id !== id));
    setCourses((p) => p.filter((c) => c.projetId !== id));
    setDetailProjet(null);
  };
  const basculerSuivi = (id) => setProjets((p) => p.map((x) => (x.id === id ? { ...x, suivi: !x.suivi } : x)));

  // terminer un projet : il devient une entrée d'archive, et le tissu utilisé est décompté
  const terminerProjet = ({ id, dateFin, photos, bilan }) => {
    const pr = projets.find((x) => x.id === id);
    if (!pr) return;

    if (pr.tissuId && pr.besoin) {
      setTissus((prev) => prev.map((t) => {
        if (t.id !== pr.tissuId) return t;
        const reste = Math.max(0, Math.round((t.metrage - pr.besoin) * 100) / 100);
        return { ...t, metrage: reste, epuise: reste <= 0.05 };
      }));
    }
    if (pr.patronId) {
      setPatrons((prev) => prev.map((x) =>
        x.id === pr.patronId && !(x.tags || []).includes(COUSU) ? { ...x, tags: [...(x.tags || []), COUSU] } : x));
    }
    setCourses((prev) => prev.filter((c) => c.projetId !== id));
    setProjets((prev) => prev.map((x) => (x.id === id ? { ...x, termine: true, suivi: false, dateFin, photos, bilan } : x)));
    setCloture(null); setDetailProjet(null);
    annonce("Cousu ! Rangé dans tes archives.");
  };

  const majArchive = (pr) => {
    setProjets((p) => p.map((x) => (x.id === pr.id ? pr : x)));
    setDetailArchive(pr);
  };

  const rouvrirProjet = (id) => {
    setProjets((p) => p.map((x) => (x.id === id ? { ...x, termine: false } : x)));
    setDetailArchive(null);
  };

  return (
    <div style={{ background: C.page, color: C.ink, minHeight: "100dvh", fontFamily: SANS }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&family=Climate+Crisis:YEAR@1979..2050&display=swap");
        button, input, select, textarea, img, .sq { border-radius: 0 !important; }
        input::placeholder, textarea::placeholder { color: #B0B0A6; }
        html, body { height: 100%; overscroll-behavior-y: none; }
        body { margin: 0; }
        /* iOS zoome sur les champs sous 16px : on force la taille au doigt */
        @media (pointer: coarse) {
          input, select, textarea { font-size: 16px !important; }
        }
        .fil { stroke-dasharray: 46; stroke-dashoffset: 46; animation: tisser .45s ease-out forwards; }
        .trame { stroke-dashoffset: 0; opacity: 0; animation: paraitre .35s ease-out forwards; }
        .courbe { stroke-dasharray: 92; stroke-dashoffset: 92; animation: tisser .5s ease-out forwards; }
        .apparait { opacity: 0; animation: monter .5s .1s ease-out forwards; }
        .apparait.tard { animation-delay: .45s; }
        @keyframes tisser { to { stroke-dashoffset: 0; } }
        @keyframes paraitre { to { opacity: 1; } }
        @keyframes monter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: 560, paddingBottom: "calc(132px + env(safe-area-inset-bottom))" }}>
        {tab === "magasin" && <Magasin tissus={tissus} mercerie={mercerie} patrons={patrons} projets={projets} courses={visibles} setCourses={setCourses} onRapide={(pf) => setRapide(pf || {})} envies={envies} onEnvie={setEditEnvie} theme={theme} setTheme={setTheme} />}
        {tab === "reserve" && (
          <Reserve tissus={tissus} mercerie={mercerie} onOpen={setDetail} onAdd={() => setEdit({})}
            onOpenMercerie={setEditMercerie} onAddMercerie={() => setEditMercerie({})} />
        )}
        {tab === "patrons" && <Patrons patrons={patrons} tags={tags} onOpen={setDetailPatron} onAdd={() => setEditPatron({})} onGererTags={() => setGestionTags(true)} />}
        {tab === "envies" && <EcranEnvies envies={envies} onOpen={setEditEnvie} onAdd={() => setEditEnvie({})} />}
        {tab === "projets" && <Projets projets={projets} patrons={patrons} tissus={tissus} onCreer={creerProjet} onSuivi={basculerSuivi} onOpen={setDetailProjet} onOpenArchive={setDetailArchive} />}
      </div>

      <Nav tab={tab} setTab={setTab} badge={aFaire} />

      {toast && (
        <div className="fixed left-0 right-0 flex justify-center px-4" style={{ bottom: "calc(88px + env(safe-area-inset-bottom))", zIndex: 60 }}>
          <div className="rounded-full flex items-center gap-2" style={{ background: C.ok, color: "#fff", padding: "9px 18px", fontSize: 14 }}>
            <Check size={16} /> {toast}
          </div>
        </div>
      )}

      {detail && !edit && <Fiche tissu={detail} onClose={() => setDetail(null)} onEdit={() => setEdit(detail)} onDelete={() => supprTissu(detail.id)} />}
      {edit && <Formulaire tissu={edit} onSave={save} onClose={() => setEdit(null)} />}
      {rapide && <SaisieRapide prefill={rapide} onSave={saveRapide} onClose={() => setRapide(null)} />}
      {detailPatron && !editPatron && <FichePatron patron={detailPatron} onClose={() => setDetailPatron(null)} onEdit={() => setEditPatron(detailPatron)} onDelete={() => supprPatron(detailPatron.id)} />}
      {editPatron && <FormulairePatron patron={editPatron} tags={tags} onCreerTag={creerTag} onSave={savePatron} onClose={() => setEditPatron(null)} />}
      {detailProjet && !cloture && <FicheProjet projet={detailProjet} patrons={patrons} tissus={tissus} onMaj={majProjet} onClose={() => setDetailProjet(null)} onDelete={() => supprProjet(detailProjet.id)} onTerminer={() => setCloture(detailProjet)} />}
      {demarrage && <Demarrage onFini={() => setDemarrage(false)} />}
      {editEnvie && <FormulaireEnvie envie={editEnvie} onSave={saveEnvie} onDelete={supprEnvie} onAcheter={acheterEnvie} onClose={() => setEditEnvie(null)} />}
      {cloture && <Cloture projet={cloture} tissus={tissus} onValider={terminerProjet} onClose={() => setCloture(null)} />}
      {detailArchive && <FicheArchive projet={detailArchive} patrons={patrons} tissus={tissus} onMaj={majArchive} onRouvrir={() => rouvrirProjet(detailArchive.id)} onClose={() => setDetailArchive(null)} />}
      {editMercerie && <FormulaireMercerie item={editMercerie} onSave={saveMercerie} onDelete={supprMercerie} onClose={() => setEditMercerie(null)} />}
      {gestionTags && <GestionTags tags={tags} patrons={patrons} onRenommer={renommerTag} onSupprimer={supprimerTag} onClose={() => setGestionTags(false)} />}
    </div>
  );
}

/* ------------------------------ MAGASIN --------------------------- */

function Magasin({ tissus, mercerie, patrons, projets, courses, setCourses, onRapide, envies, onEnvie, theme, setTheme }) {
  const [ouvert, setOuvert] = useState("liste");
  const n = courses.filter((c) => !c.fait).length;
  const suivis = projets.filter((p) => p.suivi);

  return (
    <div className="px-4 pt-6">
      <Entete section="MAGASIN" valeur={n} unite={n > 1 ? "achats" : "achat"} droite={suivis.length > 0 ? `${suivis.length} projet(s) suivi(s)` : "aucun projet suivi"}>
        <button onClick={() => setTheme(theme === "clair" ? "sombre" : "clair")}
          style={{ color: C.encre }} aria-label={theme === "clair" ? "Passer en mode soir" : "Passer en mode jour"}>
          {theme === "clair" ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
        </button>
      </Entete>

      <Accordeon titre="Ma liste" sous={n > 0 ? `${n} chose${n > 1 ? "s" : ""} à trouver` : "Rien à trouver pour l'instant"} icone={<ShoppingBasket size={19} />}
        ouvert={ouvert === "liste"} onClick={() => setOuvert(ouvert === "liste" ? "" : "liste")}>
        <Liste courses={courses} setCourses={setCourses} onRapide={onRapide} mercerie={mercerie} />
      </Accordeon>

      {suivis.length > 0 && (
        <Accordeon titre="Mes projets suivis" sous={`${suivis.length} projet${suivis.length > 1 ? "s" : ""} sous la main`} icone={<Eye size={19} />}
          ouvert={ouvert === "projets"} onClick={() => setOuvert(ouvert === "projets" ? "" : "projets")}>
          {suivis.map((pr) => {
            const pat = patrons.find((x) => x.id === pr.patronId);
            const tis = tissus.find((x) => x.id === pr.tissuId);
            const j = joursRestants(pr.echeance);
            return (
              <div key={pr.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2.5">
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: tis ? tis.couleur : C.ground, border: `1px solid ${C.line}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{pr.nom}</span>
                  {j !== null && <span style={{ fontSize: 12.5, color: couleurEcheance(j), fontWeight: 600 }}>{texteEcheance(j)}</span>}
                </div>
                <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 7, lineHeight: 1.5 }}>
                  {pat && <div>{pat.marque}{pat.taille ? ` · taille ${pat.taille}` : ""}</div>}
                  {pr.besoin !== null && pr.besoin !== undefined && <div>Il faut {fmtM(pr.besoin)}{pat ? ` en laize ${pat.laize} cm` : ""}</div>}
                  <div>{tis ? `Tissu prévu : ${tis.nom}` : "Tissu à trouver"}</div>
                  {(pat?.fournitures || []).length > 0 && <div>Mercerie : {pat.fournitures.map((x) => `${x.q} ${x.l}`).join(", ")}</div>}
                </div>
                {pat?.notes && <div style={{ fontSize: 13.5, marginTop: 8, background: C.ground, padding: "9px 12px", borderRadius: 8, lineHeight: 1.4 }}>{pat.notes}</div>}
              </div>
            );
          })}
        </Accordeon>
      )}

      <div className="flex gap-2 mb-3">
        <button onClick={() => onRapide()} className="flex-1 rounded-xl flex items-center gap-3"
          style={{ background: "transparent", border: `1px solid ${C.ink}`, color: C.ink, padding: "14px 16px", textAlign: "left" }}>
          <Zap size={22} strokeWidth={2} color={C.accent} />
          <span>
            <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>Je viens d'acheter</span>
            <span style={{ display: "block", ...mono(9, C.inkSoft, ".1em"), marginTop: 3 }}>COUP DE CŒUR HORS LISTE</span>
          </span>
        </button>
        <button onClick={() => onEnvie({})} className="rounded-xl flex flex-col items-center justify-center gap-1 flex-shrink-0"
          style={{ border: `1px solid ${C.encre}`, width: 92, color: C.encre }}>
          <Heart size={19} />
          <span style={mono(9, C.encre, ".1em")}>J'HÉSITE</span>
        </button>
      </div>

      <Accordeon titre="Combien il m'en faut ?" sous="Le métrage à demander, prix compris" ouvert={ouvert === "metrage"} onClick={() => setOuvert(ouvert === "metrage" ? "" : "metrage")}>
        <Metrage patrons={patrons} />
      </Accordeon>

      <Accordeon titre="J'ai déjà ça ?" sous="Vérifier avant de craquer" ouvert={ouvert === "doublon"} onClick={() => setOuvert(ouvert === "doublon" ? "" : "doublon")}>
        <Doublon tissus={tissus} />
      </Accordeon>
    </div>
  );
}

function Accordeon({ titre, sous, ouvert, onClick, children, icone }) {
  return (
    <div style={{ borderBottom: `0.5px solid ${C.line}` }}>
      <button onClick={onClick} className="w-full flex items-center justify-between" style={{ padding: "15px 2px", textAlign: "left" }}>
        <span className="flex items-center gap-3">
          {icone && <span style={{ color: C.bleu }}>{icone}</span>}
          <span>
            <span style={{ display: "block", fontSize: 15.5, fontWeight: 500 }}>{titre}</span>
            <span style={{ display: "block", ...mono(9, C.inkSoft, ".1em"), marginTop: 3, textTransform: "uppercase" }}>{sous}</span>
          </span>
        </span>
        <span style={{ color: C.inkSoft, fontSize: 20, transform: ouvert ? "rotate(45deg)" : "none", transition: "transform .2s" }}>+</span>
      </button>
      {ouvert && <div style={{ padding: "0 2px 20px" }}>{children}</div>}
    </div>
  );
}

/* ------------------------------- LISTE ---------------------------- */

// cherche dans le tiroir de mercerie ce qui ressemble à une ligne de courses
const dansLeTiroir = (libelle, mercerie) => {
  const l = libelle.toLowerCase();
  return mercerie.filter((m) => !m.epuise).filter((m) => {
    const t = m.type.toLowerCase().replace(/s$/, "");
    return l.includes(t) || m.nom.toLowerCase().split(/\s+/).some((mot) => mot.length > 3 && l.includes(mot));
  }).slice(0, 3);
};

function Liste({ courses, setCourses, onRapide, mercerie = [] }) {
  const [nouveau, setNouveau] = useState(false);
  const [nq, setNq] = useState("");
  const [nl, setNl] = useState("");
  const [modifie, setModifie] = useState(null);

  const cocher = (c) => {
    if (c.type === "tissu" && !c.fait) { onRapide({ nom: "", courseId: c.id, pour: c.libelle }); return; }
    if (c.type === "mercerie" && !c.fait) { onRapide({ quoi: "mercerie", courseId: c.id, pour: `${c.quantite || ""} ${c.libelle}`.trim(), quantite: c.quantite }); return; }
    setCourses((p) => p.map((x) => (x.id === c.id ? { ...x, fait: !x.fait } : x)));
  };
  const supprimer = (id) => setCourses((p) => p.filter((x) => x.id !== id));
  const ajouter = () => {
    if (!nl.trim()) return;
    setCourses((p) => [...p, { id: Date.now(), libelle: nl, quantite: nq, type: "libre", origine: "", fait: false, auto: false }]);
    setNl(""); setNq(""); setNouveau(false);
  };
  const majQuantite = (id, q) => setCourses((p) => p.map((x) => (x.id === id ? { ...x, quantite: q, auto: false } : x)));

  const aFaire = courses.filter((c) => !c.fait);
  const faits = courses.filter((c) => c.fait);

  return (
    <div>
      {courses.length === 0 && (
        <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 4 }}>
          Ta liste est vide. Crée un projet et ce qui te manque atterrira ici, ou ajoute une ligne à la main.
        </p>
      )}

      {aFaire.map((c) => (
        <div key={c.id} className="flex items-start gap-3" style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
          <button onClick={() => cocher(c)} className="rounded-md flex-shrink-0"
            style={{ width: 26, height: 26, border: `1.5px solid ${C.line}`, background: C.surface, marginTop: 1 }} aria-label={`Cocher ${c.libelle}`} />
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.3 }}>{c.libelle}</div>
            <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
              {modifie === c.id ? (
                <input autoFocus value={c.quantite} onChange={(e) => majQuantite(c.id, e.target.value)} onBlur={() => setModifie(null)}
                  onKeyDown={(e) => e.key === "Enter" && setModifie(null)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 13.5, width: 130 }} />
              ) : (
                <button onClick={() => setModifie(c.id)} className="rounded-md flex items-center gap-1.5"
                  style={{ background: C.ground, padding: "3px 8px", ...mono(11, C.ink, "0") }}>
                  {c.quantite || "quantité ?"} <Pencil size={11} color={C.inkSoft} />
                </button>
              )}
              {c.origine && <span style={mono(9, C.inkSoft, ".08em")}>{c.origine.toUpperCase()}</span>}
              {c.auto && <Wand2 size={12} color={C.inkSoft} />}
            </div>
            {c.type === "mercerie" && dansLeTiroir(c.libelle, mercerie).length > 0 && (
              <div className="rounded-lg" style={{ background: C.ground, padding: "8px 10px", marginTop: 7 }}>
                <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 4 }}>Déjà dans ton tiroir</div>
                {dansLeTiroir(c.libelle, mercerie).map((m) => (
                  <div key={m.id} className="flex items-center gap-2" style={{ fontSize: 13.5, marginTop: 3 }}>
                    <span style={{ width: 13, height: 13, borderRadius: 4, background: m.couleur, border: `1px solid ${C.line}`, flexShrink: 0 }} />
                    {m.nom}{m.quantite ? ` — ${m.quantite}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => supprimer(c.id)} className="flex-shrink-0" style={{ padding: 4 }} aria-label="Retirer de la liste">
            <X size={16} color={C.inkSoft} />
          </button>
        </div>
      ))}

      {faits.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Dans le panier</div>
          {faits.map((c) => (
            <div key={c.id} className="flex items-center gap-3" style={{ padding: "7px 0" }}>
              <button onClick={() => cocher(c)} className="rounded-md flex items-center justify-center flex-shrink-0"
                style={{ width: 26, height: 26, background: C.ok, border: `1.5px solid ${C.ok}` }} aria-label="Décocher">
                <Check size={15} color="#fff" />
              </button>
              <span style={{ fontSize: 15, color: C.inkSoft, textDecoration: "line-through" }}>{c.libelle}</span>
            </div>
          ))}
        </div>
      )}

      {nouveau ? (
        <div className="flex gap-2" style={{ marginTop: 14 }}>
          <input value={nq} onChange={(e) => setNq(e.target.value)} placeholder="6" style={{ ...inputStyle, width: 70 }} />
          <input autoFocus value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ajouter()}
            placeholder="jolis boutons en nacre" style={inputStyle} />
          <button onClick={ajouter} className="rounded-lg flex-shrink-0" style={{ background: C.bleu, color: "#fff", padding: "0 16px" }}>
            <Check size={18} />
          </button>
        </div>
      ) : (
        <button onClick={() => setNouveau(true)} className="flex items-center gap-2" style={{ marginTop: 16, fontSize: 14.5, color: C.bleu, fontWeight: 600 }}>
          <Plus size={17} /> Ajouter une ligne
        </button>
      )}
    </div>
  );
}

/* ------------------------------ PROJETS --------------------------- */

function Projets({ projets, patrons, tissus, onCreer, onSuivi, onOpen, onOpenArchive }) {
  const [vue, setVue] = useState("cours");
  const [form, setForm] = useState(false);
  const [patronId, setPatronId] = useState("");
  const [intitule, setIntitule] = useState("");
  const [estime, setEstime] = useState("");
  const [tissuId, setTissuId] = useState("");
  const [echeance, setEcheance] = useState("");
  const [notes, setNotes] = useState("");

  const p = patrons.find((x) => x.id === Number(patronId));
  const t = tissus.find((x) => x.id === Number(tissuId));

  const besoin = p ? (t ? (p.metrage * p.laize) / t.laize : p.metrage) : estime !== "" ? Number(estime) : null;
  const manque = besoin !== null && t ? Math.max(0, besoin - t.metrage) : 0;
  const nom = p ? p.nom : intitule.trim();
  const valide = !!nom;

  const reset = () => { setForm(false); setPatronId(""); setIntitule(""); setEstime(""); setTissuId(""); setEcheance(""); setNotes(""); };

  // à échéance d'abord, du plus urgent au plus lointain, puis les projets sans date
  const enCours = projets.filter((x) => !x.termine);
  const archives = useMemo(
    () => projets.filter((x) => x.termine).sort((a, b) => (b.dateFin || "").localeCompare(a.dateFin || "")),
    [projets]
  );
  const tries = useMemo(() => {
    const avec = enCours.filter((x) => x.echeance).sort((a, b) => a.echeance.localeCompare(b.echeance));
    const sans = enCours.filter((x) => !x.echeance);
    return [...avec, ...sans];
  }, [projets]);

  const creer = () => {
    if (!valide) return;
    const id = Date.now();
    const projet = { id, nom, patronId: p?.id || null, tissuId: t?.id || null, besoin, suivi: true, echeance, notes };
    const lignes = lignesProjet(projet, p, t);
    onCreer(projet, lignes);
    reset();
  };

  return (
    <div className="px-4 pt-6">
      <Entete section="PROJETS" valeur={enCours.length} unite="en cours" droite={`${archives.length} cousus`} />

      <div className="flex gap-5 mb-5" style={{ borderBottom: `0.5px solid ${C.line}` }}>
        {[["cours", `En cours${enCours.length ? ` (${enCours.length})` : ""}`], ["archives", `Cousus${archives.length ? ` (${archives.length})` : ""}`]].map(([id, label]) => (
          <button key={id} onClick={() => setVue(id)}
            style={{ ...mono(9.5, vue === id ? C.ink : C.inkSoft, ".1em"), padding: "0 0 9px", marginBottom: -1, textTransform: "uppercase",
              borderBottom: vue === id ? `1.5px solid ${C.ink}` : "1.5px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {vue === "archives" && <Archives projets={archives} patrons={patrons} tissus={tissus} onOpen={onOpenArchive} />}

      {vue === "cours" && <>
      <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 18 }}>
        Les plus urgents en haut. L'œil garde le projet sous la main en magasin.
      </p>

      {tries.map((pr, i) => {
        const pat = patrons.find((x) => x.id === pr.patronId);
        const tis = tissus.find((x) => x.id === pr.tissuId);
        const j = joursRestants(pr.echeance);
        return (
          <div key={pr.id} className=" flex items-center gap-3" style={{ borderBottom: `0.5px solid ${C.line}`, padding: "14px 2px" }}>
            <button onClick={() => onOpen(pr)} className="flex items-center gap-3 flex-1 text-left" style={{ minWidth: 0 }}>
              <Vignette objet={tis || {}} taille={52} />
              <span className="flex-1" style={{ minWidth: 0 }}>
                <span className="flex items-baseline gap-1.5">
                  <span style={mono(8.5, C.inkSoft, ".06em")}>{ref(i, "J")}</span>
                  <span style={{ fontSize: 14, color: C.ink }}>{pr.nom}</span>
                </span>
                <span className="flex items-baseline" style={{ marginTop: 5 }}>
                  <span style={mono(8.5, C.inkSoft, ".08em")}>
                    {(pat ? pat.marque : "SANS PATRON").toUpperCase()} · {(tis ? tis.nom : "TISSU À TROUVER").toUpperCase()}
                  </span>
                </span>
                {j !== null && (
                  <span className="flex items-center gap-1" style={{ ...mono(9, couleurEcheance(j), ".08em"), marginTop: 5, textTransform: "uppercase" }}>
                    <CalendarClock size={11} /> {texteEcheance(j)}
                  </span>
                )}
              </span>
            </button>
            <button onClick={() => onSuivi(pr.id)} className="rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ width: 40, height: 40, background: pr.suivi ? C.fil : C.surface, border: `1px solid ${pr.suivi ? C.fil : C.line}` }}
              aria-label={pr.suivi ? "Retirer du magasin" : "Garder sous la main en magasin"}>
              {pr.suivi ? <Eye size={17} color={C.ink} /> : <EyeOff size={17} color={C.inkSoft} />}
            </button>
          </div>
        );
      })}

      <BoutonAjout label="Nouveau projet" onClick={() => setForm(true)} />

      {form && (
        <Overlay onClose={reset}>
          <div style={{ padding: "10px 20px 24px" }}>
            <TitreFeuille>Nouveau projet</TitreFeuille>
            <Champ label="Quel patron ?">
              <select value={patronId} onChange={(e) => setPatronId(e.target.value)} style={inputStyle}>
                <option value="">Pas encore choisi</option>
                {patrons.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.marque}</option>)}
              </select>
            </Champ>

            {!p && (
              <div className="grid grid-cols-2 gap-3">
                <Champ label="Tu veux en faire quoi ?">
                  <input autoFocus value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Une chemise" style={inputStyle} />
                </Champ>
                <Champ label="Métrage estimé (m)">
                  <input type="number" step="0.1" inputMode="decimal" value={estime} onChange={(e) => setEstime(e.target.value)} placeholder="si tu sais" style={inputStyle} />
                </Champ>
              </div>
            )}

            <Champ label="Dans quel tissu ?">
              <select value={tissuId} onChange={(e) => setTissuId(e.target.value)} style={inputStyle}>
                <option value="">Je ne l'ai pas encore</option>
                {tissus.map((x) => <option key={x.id} value={x.id}>{x.nom} — {fmtM(x.metrage)}</option>)}
              </select>
            </Champ>

            <Champ label="À finir pour quand ? (facultatif)">
              <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={inputStyle} />
            </Champ>

            <Champ label="Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Cadeau pour ma sœur, taille au-dessus…" style={{ ...inputStyle, resize: "none" }} />
            </Champ>

            <div className="rounded-lg" style={{ background: C.ground, padding: "13px 15px", fontSize: 14.5, lineHeight: 1.5, marginBottom: 14 }}>
              {besoin === null && !t && <>Ni patron ni tissu pour l'instant : le projet sera juste une idée en attente.</>}
              {besoin === null && t && <>Ton coupon de {fmtM(t.metrage)} est réservé à ce projet. Le métrage nécessaire viendra avec le patron.</>}
              {besoin !== null && !t && <>Il te faudra environ <strong>{fmtM(besoin * 1.1)}</strong>, marge comprise.</>}
              {besoin !== null && t && manque > 0.01 && <>Il te manque <strong>{fmtM(manque)}</strong> : il en faut {fmtM(besoin)}{p ? ` en laize ${t.laize} cm` : ""}, ton coupon en fait {fmtM(t.metrage)}.</>}
              {besoin !== null && t && manque <= 0.01 && <>Ton coupon suffit : {fmtM(t.metrage)} pour {fmtM(besoin)} nécessaires.</>}
              {(p?.fournitures || []).length > 0 && <> La mercerie du patron partira aussi dans ta liste.</>}
              <> Le fil assorti y sera ajouté d'office.</>
            </div>

            <div className="flex gap-2">
              <button onClick={creer} disabled={!valide} className="flex-1 rounded-lg"
                style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 13, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
                Créer le projet
              </button>
              <button onClick={reset} className="rounded-lg" style={{ border: `1px solid ${C.line}`, padding: "13px 18px", color: C.inkSoft, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>Annuler</button>
            </div>
          </div>
        </Overlay>
      )}
      </>}
    </div>
  );
}

function Archives({ projets, patrons, tissus, onOpen }) {
  if (projets.length === 0) {
    return (
      <div className="text-center py-12">
        <div style={{ color: C.bleu, display: "flex", justifyContent: "center" }}><Archive size={26} strokeWidth={1.5} /></div>
        <p style={{ fontSize: 15, marginTop: 12 }}>Rien de cousu pour l'instant.</p>
        <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6, lineHeight: 1.5, padding: "0 24px" }}>
          Quand tu termines un projet, il vient ici avec sa date, sa photo et ton bilan.
        </p>
      </div>
    );
  }
  return (
    <div>
      {projets.map((pr) => {
        const pat = patrons.find((x) => x.id === pr.patronId);
        const tis = tissus.find((x) => x.id === pr.tissuId);
        return (
          <button key={pr.id} onClick={() => onOpen(pr)} className="w-full text-left  flex items-center gap-3"
            style={{ borderBottom: `0.5px solid ${C.line}`, padding: "13px 2px" }}>
            <Vignette objet={photosDe(pr).length ? pr : (tis || {})} taille={64} />
            <span className="flex-1" style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, color: C.ink }}>{pr.nom}</span>
              <span style={{ display: "block", ...mono(8.5, C.inkSoft, ".08em"), marginTop: 5 }}>
                {(pat ? pat.marque : "SANS PATRON").toUpperCase()}{tis ? ` · ${tis.nom.toUpperCase()}` : ""}
              </span>
              {pr.dateFin && <span style={{ display: "block", ...mono(9, C.inkSoft, ".06em"), marginTop: 4 }}>{fmtDate(pr.dateFin)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FicheProjet({ projet, patrons, tissus, onMaj, onClose, onDelete, onTerminer }) {
  const pat = patrons.find((x) => x.id === projet.patronId);
  const tis = tissus.find((x) => x.id === projet.tissuId);
  const j = joursRestants(projet.echeance);

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <h2 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{projet.nom}</h2>
        <p style={{ ...mono(9, C.inkSoft, ".1em"), marginTop: 6, textTransform: "uppercase" }}>
          {pat ? `${pat.marque}${pat.taille ? ` · T.${pat.taille}` : ""}` : "Patron à trouver"}
        </p>
        <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 11 }} />

        <div className="flex items-center gap-2.5 rounded-lg mt-4" style={{ background: C.ground, padding: "12px 14px" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: tis ? tis.couleur : C.surface, border: `1px solid ${C.line}`, flexShrink: 0 }} />
          <span style={{ fontSize: 14.5 }}>
            {tis ? tis.nom : "Tissu à trouver"}
            {projet.besoin !== null && projet.besoin !== undefined && (
              <span style={{ display: "block", fontSize: 13, color: C.inkSoft, marginTop: 1 }}>Il en faut {fmtM(projet.besoin)}</span>
            )}
          </span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Champ label="Nom du projet">
            <input value={projet.nom} onChange={(e) => onMaj({ ...projet, nom: e.target.value })} style={inputStyle} />
          </Champ>

          <Champ label="Quel patron ?">
            <select value={projet.patronId || ""} onChange={(e) => onMaj({ ...projet, patronId: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
              <option value="">Pas encore choisi</option>
              {patrons.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.marque}</option>)}
            </select>
          </Champ>

          <Champ label="Dans quel tissu ?">
            <select value={projet.tissuId || ""} onChange={(e) => onMaj({ ...projet, tissuId: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
              <option value="">Je ne l'ai pas encore</option>
              {tissus.map((x) => <option key={x.id} value={x.id}>{x.nom} — {fmtM(x.metrage)}</option>)}
            </select>
          </Champ>

          <Champ label="À finir pour quand ?">
            <input type="date" value={projet.echeance || ""} onChange={(e) => onMaj({ ...projet, echeance: e.target.value })} style={inputStyle} />
          </Champ>
          {j !== null && (
            <p className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: couleurEcheance(j), fontWeight: 600, marginTop: -10, marginBottom: 16 }}>
              <CalendarClock size={14} /> {texteEcheance(j)}
            </p>
          )}

          <Champ label="Notes">
            <textarea value={projet.notes || ""} onChange={(e) => onMaj({ ...projet, notes: e.target.value })} rows={4}
              placeholder="Où tu en es, ce qui coince, pour qui c'est…" style={{ ...inputStyle, resize: "none" }} />
          </Champ>
        </div>

        <button onClick={onTerminer} className="w-full rounded-lg flex items-center justify-center gap-2 mb-2"
          style={{ background: C.ink, color: C.page, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          <CircleCheckBig size={17} /> Marquer comme cousu
        </button>

        <button onClick={() => onMaj({ ...projet, suivi: !projet.suivi })} className="w-full rounded-lg flex items-center justify-center gap-2 mb-2"
          style={{ border: `1px solid ${projet.suivi ? C.fil : C.line}`, background: projet.suivi ? C.fil : C.surface, padding: 12, fontSize: 15 }}>
          {projet.suivi ? <><Eye size={17} /> Sous la main en magasin</> : <><EyeOff size={17} color={C.inkSoft} /> <span style={{ color: C.inkSoft }}>Pas en magasin</span></>}
        </button>

        <button onClick={onDelete} className="w-full rounded-lg flex items-center justify-center gap-2"
          style={{ border: `1px solid ${C.line}`, padding: 13, color: C.alerte, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          <Trash2 size={16} /> Supprimer le projet
        </button>
      </div>
    </Overlay>
  );
}

function EcranEnvies({ envies, onOpen, onAdd }) {
  const [quoi, setQuoi] = useState("Tout");
  const types = ["Tout", ...["tissu", "patron", "mercerie"].filter((t) => envies.some((e) => e.quoi === t))];
  const liste = envies.filter((e) => quoi === "Tout" || e.quoi === quoi);

  return (
    <div className="px-4 pt-6">
      <Entete section="ENVIES" valeur={envies.length} unite={envies.length > 1 ? "en attente" : "en attente"} droite="repérées, pas décidées" />

      {types.length > 1 && (
        <div className="flex gap-5 mb-5 overflow-x-auto pb-1">
          {types.map((t) => (
            <button key={t} onClick={() => setQuoi(t)} className="rounded-full whitespace-nowrap"
              style={{ padding: "6px 13px", fontSize: 13, textTransform: t === "Tout" ? "none" : "capitalize",
                border: `1px solid ${quoi === t ? C.bleu : C.line}`, background: quoi === t ? C.bleu : C.surface, color: quoi === t ? "#fff" : C.inkSoft }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {liste.length === 0 ? (
        <div className="text-center py-12">
          <div style={{ color: C.bleu, display: "flex", justifyContent: "center" }}><Heart size={26} strokeWidth={1.5} /></div>
          <p style={{ fontSize: 15, marginTop: 12 }}>Aucune envie en attente.</p>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6, lineHeight: 1.5, padding: "0 24px" }}>
            En magasin, le bouton « J'hésite » met de côté ce qui te tente sans que tu décides tout de suite.
          </p>
        </div>
      ) : (
        liste.map((e) => (
          <button key={e.id} onClick={() => onOpen(e)} className="w-full text-left  flex items-center gap-3"
            style={{ borderBottom: `0.5px solid ${C.line}`, padding: "13px 2px" }}>
            <Vignette objet={e.photo ? { photos: [e.photo] } : e} taille={66} />
            <span className="flex-1" style={{ minWidth: 0 }}>
              <span className="flex items-baseline">
                <span style={{ fontSize: 14, color: C.ink }}>{e.nom}</span>
                <Points />
                {e.prix !== "" && e.prix != null && <span style={mono(11.5, C.ink, "0")}>{fmtE(e.prix)}</span>}
              </span>
              <span style={{ display: "block", ...mono(8.5, C.inkSoft, ".08em"), marginTop: 5 }}>
                {e.quoi.toUpperCase()}{e.boutique ? ` · ${e.boutique.toUpperCase()}` : ""} · REPÉRÉ {ilYA(e.depuis).toUpperCase()}
              </span>
              {e.notes && <span style={{ display: "block", fontSize: 12.5, color: C.inkSoft, marginTop: 6 }}>« {e.notes} »</span>}
            </span>
          </button>
        ))
      )}

      <BoutonAjout label="Ajouter une envie" onClick={onAdd} />
    </div>
  );
}

function FormulaireEnvie({ envie, onSave, onDelete, onAcheter, onClose }) {
  const [f, setF] = useState({
    id: envie.id, quoi: envie.quoi || "tissu", nom: envie.nom || "", couleur: envie.couleur || "#2E5A8A",
    prix: envie.prix ?? "", boutique: envie.boutique || "", notes: envie.notes || "",
    photo: envie.photo || null, depuis: envie.depuis,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valide = f.nom.trim();

  const choisirPhoto = (e) => {
    if (e.target.files) lirePhotos(e.target.files, (d) => set("photo", d));
    e.target.value = "";
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>{envie.id ? "Cette envie" : "J'hésite"}</TitreFeuille>
        <p style={{ ...mono(9.5, C.inkSoft, ".06em"), marginTop: 6, marginBottom: 16, lineHeight: 1.5 }}>
          {envie.id && f.depuis ? `Repéré ${ilYA(f.depuis)}.` : "Noté maintenant, décidé plus tard."}
        </p>

        <div className="flex gap-5 mb-5" style={{ borderBottom: `0.5px solid ${C.line}` }}>
          {[["tissu", "Tissu"], ["patron", "Patron"], ["mercerie", "Mercerie"]].map(([id, label]) => (
            <button key={id} onClick={() => set("quoi", id)} className="rounded-none"
              style={{
                padding: "0 0 9px", fontSize: 14.5, fontWeight: f.quoi === id ? 600 : 400,
                color: f.quoi === id ? C.ink : C.inkSoft, marginBottom: -1,
                borderBottom: f.quoi === id ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
              }}>
              {label}
            </button>
          ))}
        </div>

        <Champ label="C'est quoi ?">
          <input autoFocus={!envie.id} value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Double gaze bleu canard" style={inputStyle} />
        </Champ>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 6, textTransform: "uppercase" }}>Photo</span>
          {f.photo ? (
            <div className="flex items-center gap-3">
              <img src={f.photo} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover" }} />
              <button onClick={() => set("photo", null)} style={{ fontSize: 14, color: C.inkSoft }}>Retirer</button>
            </div>
          ) : (
            <label className="rounded-lg flex items-center justify-center gap-2"
              style={{ border: `1px dashed ${C.line}`, background: C.surface, padding: 14, fontSize: 15, color: C.inkSoft, cursor: "pointer" }}>
              <Camera size={18} /> Photographier
              <input type="file" accept="image/*" onChange={choisirPhoto} style={{ display: "none" }} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Champ label="Prix (€)">
            <input type="number" step="0.1" inputMode="decimal" value={f.prix}
              onChange={(e) => set("prix", e.target.value === "" ? "" : Number(e.target.value))} placeholder="16,90" style={inputStyle} />
          </Champ>
          <Champ label="Où ?">
            <input value={f.boutique} onChange={(e) => set("boutique", e.target.value)} placeholder="Mondial Tissus" style={inputStyle} />
          </Champ>
        </div>

        <Champ label="Pourquoi tu hésites ?">
          <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
            placeholder="Un peu cher, pas sûre de la couleur…" style={{ ...inputStyle, resize: "none" }} />
        </Champ>

        <button onClick={() => valide && onSave(f)} disabled={!valide} className="w-full rounded-lg mb-2"
          style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          {envie.id ? "Enregistrer" : "Garder sous le coude"}
        </button>

        {envie.id && (
          <div className="flex gap-2">
            <button onClick={() => onAcheter(f)} className="flex-1 rounded-lg" style={{ background: C.ink, color: C.page, padding: 13, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Je l'ai pris
            </button>
            <button onClick={() => onDelete(envie.id)} className="flex-1 rounded-lg"
              style={{ border: `1px solid ${C.line}`, padding: 13, color: C.inkSoft, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Finalement non
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

function Galerie({ photos, onRetirer, onAjouter }) {
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((src, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={src} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", display: "block" }} />
          <button onClick={() => onRetirer(i)} className="rounded-full flex items-center justify-center"
            style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, background: C.ink, border: "2px solid #fff" }}
            aria-label="Retirer cette photo">
            <X size={13} color="#fff" />
          </button>
        </div>
      ))}
      <label className="rounded-lg flex flex-col items-center justify-center gap-1"
        style={{ width: 84, height: 84, border: `1px dashed ${C.line}`, background: C.surface, color: C.inkSoft, cursor: "pointer" }}>
        <Camera size={20} />
        <span style={{ fontSize: 11.5 }}>Ajouter</span>
        <input type="file" accept="image/*" multiple onChange={onAjouter} style={{ display: "none" }} />
      </label>
    </div>
  );
}

function Cloture({ projet, tissus, onValider, onClose }) {
  const [dateFin, setDateFin] = useState(aujourdhui());
  const [bilan, setBilan] = useState("");
  const [photos, setPhotos] = useState([]);
  const t = tissus.find((x) => x.id === projet.tissuId);
  const reste = t && projet.besoin ? Math.max(0, Math.round((t.metrage - projet.besoin) * 100) / 100) : null;

  const choisirPhotos = (e) => {
    if (e.target.files) lirePhotos(e.target.files, (d) => setPhotos((p) => [...p, d]));
    e.target.value = "";
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>{projet.nom}, terminé</TitreFeuille>
        <p style={{ ...mono(9.5, C.inkSoft, ".06em"), marginTop: 6, marginBottom: 18, lineHeight: 1.5 }}>
          Bravo. Ça part dans tes archives.
        </p>

        <Champ label="Cousu le">
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={inputStyle} />
        </Champ>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 6, textTransform: "uppercase" }}>Photos</span>
          <Galerie photos={photos} onRetirer={(i) => setPhotos((p) => p.filter((_, j) => j !== i))} onAjouter={choisirPhotos} />
          <span style={{ fontSize: 12.5, color: C.inkSoft, display: "block", marginTop: 6 }}>
            Tu pourras en ajouter plus tard depuis l'archive.
          </span>
        </div>

        <Champ label="Ton bilan">
          <textarea value={bilan} onChange={(e) => setBilan(e.target.value)} rows={3}
            placeholder="Ce qui a bien marché, ce que tu referais autrement…" style={{ ...inputStyle, resize: "none" }} />
        </Champ>

        {reste !== null && (
          <div className="rounded-lg" style={{ background: C.ground, padding: "13px 15px", fontSize: 14.5, lineHeight: 1.5, marginBottom: 14 }}>
            {reste <= 0.05
              ? <>{t.nom} sera marqué épuisé. Il restera consultable dans ta réserve.</>
              : <>{t.nom} passera de {fmtM(t.metrage)} à <strong>{fmtM(reste)}</strong>.</>}
          </div>
        )}

        <button onClick={() => onValider({ id: projet.id, dateFin, photos, bilan })} className="w-full rounded-lg"
          style={{ background: C.ink, color: C.page, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Ranger dans les archives
        </button>
      </div>
    </Overlay>
  );
}

function FicheArchive({ projet, patrons, tissus, onMaj, onRouvrir, onClose }) {
  const pat = patrons.find((x) => x.id === projet.patronId);
  const tis = tissus.find((x) => x.id === projet.tissuId);
  const photos = photosDe(projet);

  const ajouterPhotos = (e) => {
    if (e.target.files) lirePhotos(e.target.files, (d) => onMaj({ ...projet, photos: [...photosDe(projet), d], photo: undefined }));
    e.target.value = "";
  };
  const retirerPhoto = (i) => onMaj({ ...projet, photos: photos.filter((_, j) => j !== i), photo: undefined });

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <h2 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{projet.nom}</h2>
        <p style={{ ...mono(9, C.inkSoft, ".1em"), marginTop: 6, textTransform: "uppercase" }}>
          {pat ? `${pat.nom} — ${pat.marque}` : "Sans patron"}{pat?.taille ? ` · T.${pat.taille}` : ""}
        </p>
        <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 11 }} />

        <div style={{ marginTop: 18 }}>
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 6, textTransform: "uppercase" }}>Photos</span>
          <Galerie photos={photos} onRetirer={retirerPhoto} onAjouter={ajouterPhotos} />
        </div>

        <div className="rounded-lg mt-5" style={{ background: C.ground, padding: "14px 16px" }}>
          <div className="flex items-center gap-2.5">
            <span style={{ width: 26, height: 26, borderRadius: 7, background: tis ? tis.couleur : C.surface, border: `1px solid ${C.line}`, flexShrink: 0 }} />
            <span style={{ fontSize: 14.5 }}>{tis ? tis.nom : "Tissu non renseigné"}</span>
          </div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
            {projet.besoin != null && <div>{fmtM(projet.besoin)} utilisés</div>}
            {tis?.boutique && <div>Acheté chez {tis.boutique}</div>}
            {tis?.epuise && <div>Coupon épuisé depuis</div>}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Champ label="Cousu le">
            <input type="date" value={projet.dateFin || ""} onChange={(e) => onMaj({ ...projet, dateFin: e.target.value })} style={inputStyle} />
          </Champ>

          <Champ label="Ton bilan">
            <textarea value={projet.bilan || ""} onChange={(e) => onMaj({ ...projet, bilan: e.target.value })} rows={4}
              placeholder="Ce qui a bien marché, ce que tu referais autrement…" style={{ ...inputStyle, resize: "none" }} />
          </Champ>
        </div>

        {projet.notes && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 4 }}>Notes prises pendant le projet</div>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: C.inkSoft }}>{projet.notes}</p>
          </div>
        )}

        <button onClick={onRouvrir} className="w-full rounded-lg"
          style={{ border: `1px solid ${C.line}`, padding: 13, color: C.inkSoft, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Remettre en cours
        </button>
      </div>
    </Overlay>
  );
}

/* ------------------------------ PATRONS --------------------------- */

function Patrons({ patrons, tags, onOpen, onAdd, onGererTags }) {
  const [vue, setVue] = useState("liste");
  const [cat, setCat] = useState("Tout");
  const [tag, setTag] = useState("");

  const cats = useMemo(() => ["Tout", ...CATEGORIES.filter((c) => patrons.some((p) => p.categorie === c))], [patrons]);
  const tagsUtilises = useMemo(() => tags.filter((t) => patrons.some((p) => (p.tags || []).includes(t))), [tags, patrons]);
  const liste = patrons.filter((p) => (cat === "Tout" || p.categorie === cat) && (!tag || (p.tags || []).includes(tag)));
  const cousus = patrons.filter((p) => (p.tags || []).includes(COUSU)).length;

  return (
    <div className="px-4 pt-6">
      <Entete section="PATRONS" valeur={patrons.length} unite="réf" droite={`${cousus} déjà cousus`}>
        <Bascule vue={vue} setVue={setVue} />
      </Entete>

      <div className="flex gap-4 overflow-x-auto pb-1" style={{ marginBottom: 8 }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className="whitespace-nowrap"
            style={{ ...mono(9, cat === c ? C.ink : C.inkSoft, ".1em"), padding: "4px 0", textTransform: "uppercase" }}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 items-center" style={{ marginBottom: 16 }}>
        {tagsUtilises.map((t) => (
          <button key={t} onClick={() => setTag(tag === t ? "" : t)} className="whitespace-nowrap"
            style={{ ...mono(9, tag === t ? C.ink : C.inkSoft, ".1em"), padding: "4px 0", textTransform: "uppercase" }}>
            {t}
          </button>
        ))}
        <button onClick={onGererTags} className="whitespace-nowrap flex-shrink-0" style={mono(9, C.inkSoft, ".1em")}>GÉRER</button>
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ fontSize: 14.5 }}>Aucun patron dans cette catégorie.</p>
        </div>
      ) : vue === "liste" ? (
        <div>
          {liste.map((p, i) => (
            <button key={p.id} onClick={() => onOpen(p)} className="w-full text-left flex gap-3"
              style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.line}` }}>
              <VignettePatron patron={p} indice={i} taille={76} />
              <span className="flex-1" style={{ minWidth: 0 }}>
                <span className="flex items-baseline gap-1.5">
                  <span style={mono(8.5, C.inkSoft, ".06em")}>{ref(i, "P")}</span>
                  <span style={{ fontSize: 14, color: C.ink }}>{p.nom}</span>
                </span>
                <span className="flex items-baseline" style={{ marginTop: 5 }}>
                  <span style={mono(8.5, C.inkSoft, ".08em")}>
                    {(p.marque || "SANS MARQUE").toUpperCase()}{p.taille ? ` · T.${p.taille}` : ""} · L.{p.laize}
                  </span>
                  <Points />
                  <span style={mono(12, C.ink, "0")}>{Number(p.metrage).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
                {(p.tags || []).length > 0 && (
                  <span className="flex flex-wrap gap-1.5" style={{ marginTop: 7 }}>
                    {tagsTries(p.tags).map((t) => <Tampon key={t} texte={t} plein={t === COUSU} />)}
                  </span>
                )}
                {p.notes && <span style={{ display: "block", fontSize: 12.5, color: C.inkSoft, marginTop: 7 }}>« {p.notes} »</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {liste.map((p, i) => (
            <button key={p.id} onClick={() => onOpen(p)} className="text-left">
              <VignettePatron patron={p} indice={i} carre />
              <span className="flex items-baseline gap-1.5" style={{ marginTop: 7 }}>
                <span style={mono(8, C.inkSoft, ".06em")}>{ref(i, "P")}</span>
                <span style={{ fontSize: 12.5, color: C.ink }}>{p.nom}</span>
              </span>
              <span className="flex items-baseline" style={{ marginTop: 3 }}>
                <span style={mono(8, C.inkSoft, ".06em")}>{(p.marque || "—").toUpperCase()}</span>
                <Points />
                <span style={mono(10.5, C.ink, "0")}>{Number(p.metrage).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <BoutonAjout label="Ajouter un patron" onClick={onAdd} />
    </div>
  );
}

function Tampon({ texte, plein }) {
  return (
    <span style={{ ...mono(7.5, plein ? C.ink : C.inkSoft, ".08em"), border: `0.5px solid ${plein ? C.ink : C.pointille}`, padding: "2px 5px", textTransform: "uppercase" }}>
      {texte}
    </span>
  );
}

function VignettePatron({ patron, indice, taille, carre }) {
  const photo = photosDe(patron)[0];
  const style = carre ? { width: "100%", aspectRatio: "1" } : { width: taille, height: taille, flexShrink: 0 };
  const cousu = (patron.tags || []).includes(COUSU);

  if (photo) {
    return (
      <span style={{ ...style, position: "relative", display: "block" }}>
        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {cousu && carre && (
          <span style={{ ...mono(7.5, C.page, ".08em"), position: "absolute", left: 6, top: 6, background: C.ink, padding: "2px 5px" }}>COUSU</span>
        )}
      </span>
    );
  }
  return (
    <span className="flex flex-col items-center justify-center" style={{ ...style, border: `0.5px dashed ${C.pointille}`, gap: 4, position: "relative" }}>
      {cousu && carre && (
        <span style={{ ...mono(7.5, C.page, ".08em"), position: "absolute", left: 6, top: 6, background: C.ink, padding: "2px 5px" }}>COUSU</span>
      )}
      <span style={mono(9, C.inkSoft, ".12em")}>{ref(indice, "P")}</span>
      {carre && <span style={mono(8, C.faible, ".1em")}>{(patron.categorie || "").toUpperCase()}</span>}
    </span>
  );
}

function GestionTags({ tags, patrons, onRenommer, onSupprimer, onClose }) {
  const [renomme, setRenomme] = useState(null);
  const [valeur, setValeur] = useState("");
  const compte = (t) => patrons.filter((p) => (p.tags || []).includes(t)).length;

  const valider = () => { if (renomme) onRenommer(renomme, valeur); setRenomme(null); setValeur(""); };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>Mes tags</TitreFeuille>
        <p style={{ ...mono(9.5, C.inkSoft, ".06em"), marginTop: 6, marginBottom: 18, lineHeight: 1.5 }}>
          Renommer met à jour tous les patrons concernés. Supprimer retire le tag partout, les patrons restent.
        </p>

        {tags.map((t) => (
          <div key={t} className="flex items-center gap-2" style={{ padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
            {renomme === t ? (
              <>
                <input autoFocus value={valeur} onChange={(e) => setValeur(e.target.value)} onKeyDown={(e) => e.key === "Enter" && valider()} style={inputStyle} />
                <button onClick={valider} className="rounded-lg flex-shrink-0" style={{ background: C.bleu, color: "#fff", padding: "9px 14px" }} aria-label="Valider">
                  <Check size={17} />
                </button>
              </>
            ) : (
              <>
                <span className="rounded-full" style={{ fontSize: 13, padding: "4px 11px", background: t === COUSU ? C.accent : C.ground, color: t === COUSU ? "#fff" : C.ink }}>{t}</span>
                <span className="flex-1" style={{ fontSize: 13, color: C.inkSoft }}>
                  {compte(t)} patron{compte(t) > 1 ? "s" : ""}
                </span>
                {t === COUSU ? (
                  <span style={{ fontSize: 12.5, color: C.inkSoft }}>tag fixe</span>
                ) : (
                  <>
                    <button onClick={() => { setRenomme(t); setValeur(t); }} style={{ padding: 6 }} aria-label={`Renommer ${t}`}>
                      <Pencil size={16} color={C.inkSoft} />
                    </button>
                    <button onClick={() => onSupprimer(t)} style={{ padding: 6 }} aria-label={`Supprimer ${t}`}>
                      <Trash2 size={16} color={C.alerte} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ))}

        <button onClick={onClose} className="w-full rounded-lg mt-5" style={{ background: C.ink, color: C.page, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Terminé
        </button>
      </div>
    </Overlay>
  );
}

function FichePatron({ patron, onClose, onEdit, onDelete }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <h2 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{patron.nom}</h2>
        <p style={{ ...mono(9, C.inkSoft, ".1em"), marginTop: 6, textTransform: "uppercase" }}>{patron.marque}{patron.categorie ? ` · ${patron.categorie}` : ""}</p>
        <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 11 }} />

        {(patron.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 12 }}>
            {tagsTries(patron.tags).map((t) => <Tampon key={t} texte={t} plein={t === COUSU} />)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-y-4 mt-5">
          <Info label="Métrage requis" valeur={fmtM(patron.metrage)} fort />
          <Info label="Pour une laize de" valeur={`${patron.laize} cm`} />
          <Info label="Ta taille" valeur={patron.taille || "—"} />
        </div>

        {(patron.fournitures || []).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 7 }}>Mercerie</div>
            {patron.fournitures.map((f, i) => (
              <div key={i} className="flex items-center gap-2" style={{ fontSize: 15, marginBottom: 5 }}>
                <ShoppingBasket size={14} color={C.inkSoft} /> {f.q} {f.l}
              </div>
            ))}
          </div>
        )}

        {patron.notes && <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.5, background: C.ground, padding: "12px 14px", borderRadius: 10 }}>{patron.notes}</p>}

        <div className="flex gap-2 mt-6">
          <button onClick={onEdit} className="flex-1 rounded-lg flex items-center justify-center gap-2" style={{ background: C.ink, color: C.page, padding: 13, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
            <Pencil size={16} /> Modifier
          </button>
          <button onClick={onDelete} className="rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.surface, width: 48 }} aria-label="Supprimer">
            <Trash2 size={17} color={C.alerte} />
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function FormulairePatron({ patron, tags, onCreerTag, onSave, onClose }) {
  const [f, setF] = useState({
    id: patron.id,
    nom: patron.nom || "", marque: patron.marque || "", categorie: patron.categorie || "Haut",
    metrage: patron.metrage ?? "", laize: patron.laize || 140, taille: patron.taille || "",
    tags: patron.tags || [], notes: patron.notes || "", photos: patron.photos || [],
    fournitures: [...(patron.fournitures || []), { q: "", l: "" }],
  });
  const [nouveauTag, setNouveauTag] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valide = f.nom.trim() && f.metrage !== "";

  const majF = (i, k, v) => setF((p) => {
    const four = p.fournitures.map((x, j) => (j === i ? { ...x, [k]: v } : x));
    if (i === four.length - 1 && (four[i].q || four[i].l)) four.push({ q: "", l: "" });
    return { ...p, fournitures: four };
  });

  const basculerTag = (t) => set("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t]);
  const creerEtAjouter = () => {
    const t = nouveauTag.trim();
    if (!t) return;
    onCreerTag(t);
    if (!f.tags.includes(t)) set("tags", [...f.tags, t]);
    setNouveauTag("");
  };
  const enregistrer = () => { if (valide) onSave({ ...f, metrage: Number(f.metrage), fournitures: f.fournitures.filter((x) => x.l.trim()) }); };

  const tousTags = tags.includes(COUSU) ? [COUSU, ...tags.filter((t) => t !== COUSU)] : [COUSU, ...tags];

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>{patron.id ? "Modifier le patron" : "Nouveau patron"}</TitreFeuille>

        <Champ label="Nom du patron">
          <input autoFocus={!patron.id} value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Cherry Hills" style={inputStyle} />
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Marque">
            <input value={f.marque} onChange={(e) => set("marque", e.target.value)} placeholder="Deer & Doe" style={inputStyle} />
          </Champ>
          <Champ label="Catégorie">
            <select value={f.categorie} onChange={(e) => set("categorie", e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Champ>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Métrage requis (m)">
            <input type="number" step="0.1" inputMode="decimal" value={f.metrage}
              onChange={(e) => set("metrage", e.target.value === "" ? "" : Number(e.target.value))} placeholder="1,8" style={inputStyle} />
          </Champ>
          <Champ label="Pour une laize de (cm)">
            <input type="number" inputMode="numeric" value={f.laize} onChange={(e) => set("laize", Number(e.target.value))} style={inputStyle} />
          </Champ>
        </div>
        <Champ label="Ta taille sur ce patron">
          <input value={f.taille} onChange={(e) => set("taille", e.target.value)} placeholder="38" style={{ ...inputStyle, maxWidth: 140 }} />
        </Champ>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 6, textTransform: "uppercase" }}>Photos de la pochette</span>
          <Galerie photos={photosDe(f)} onRetirer={(i) => set("photos", photosDe(f).filter((_, j) => j !== i))}
            onAjouter={(e) => { if (e.target.files) lirePhotos(e.target.files, (d) => setF((p) => ({ ...p, photos: [...photosDe(p), d] }))); e.target.value = ""; }} />
        </div>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 8, textTransform: "uppercase" }}>Tags</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {tousTags.map((t) => {
              const actif = f.tags.includes(t);
              return (
                <button key={t} onClick={() => basculerTag(t)} className="rounded-full"
                  style={{
                    padding: "6px 12px", fontSize: 13,
                    border: `1px solid ${actif ? (t === COUSU ? C.accent : C.fil) : C.line}`,
                    background: actif ? (t === COUSU ? C.accent : C.fil) : C.surface,
                    color: actif ? (t === COUSU ? "#fff" : C.ink) : C.inkSoft,
                    fontWeight: actif ? 600 : 400,
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input value={nouveauTag} onChange={(e) => setNouveauTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && creerEtAjouter()}
              placeholder="Créer un tag : chaud, cadeau…" style={inputStyle} />
            <button onClick={creerEtAjouter} className="rounded-lg flex-shrink-0" style={{ background: C.bleu, color: "#fff", padding: "0 16px" }} aria-label="Créer le tag">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 2, textTransform: "uppercase" }}>Mercerie demandée par le patron</span>
          <span style={{ ...mono(8.5, C.inkSoft, ".08em"), display: "block", marginBottom: 8 }}>Elle partira dans ta liste de courses à chaque projet.</span>
          {f.fournitures.map((x, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={x.q} onChange={(e) => majF(i, "q", e.target.value)} placeholder="6" style={{ ...inputStyle, width: 70 }} />
              <input value={x.l} onChange={(e) => majF(i, "l", e.target.value)} placeholder="boutons" style={inputStyle} />
            </div>
          ))}
        </div>

        <Champ label="Tes notes">
          <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
            placeholder="Rallonger de 10 cm, emmanchures justes…" style={{ ...inputStyle, resize: "none" }} />
        </Champ>

        <button onClick={enregistrer} disabled={!valide} className="w-full rounded-lg"
          style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          {patron.id ? "Enregistrer les modifications" : "Ajouter le patron"}
        </button>
      </div>
    </Overlay>
  );
}

/* ------------------------------ OUTILS ---------------------------- */

function Metrage({ patrons }) {
  const [patronId, setPatronId] = useState(patrons[0]?.id);
  const [laize, setLaize] = useState(140);
  const [prix, setPrix] = useState("");
  const [marge, setMarge] = useState(true);

  const p = patrons.find((x) => x.id === Number(patronId));
  const brut = p && laize > 0 ? (p.metrage * p.laize) / laize : 0;
  const besoin = marge ? brut * 1.1 : brut;
  const total = prix ? (Math.ceil(besoin * 10) / 10) * Number(prix) : 0;

  return (
    <div>
      <Champ label="Pour quel patron ?">
        <select value={patronId} onChange={(e) => setPatronId(e.target.value)} style={inputStyle}>
          {patrons.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.marque}</option>)}
        </select>
      </Champ>
      {p && <p style={{ fontSize: 13, color: C.inkSoft, marginTop: -10, marginBottom: 14 }}>Le patron demande {fmtM(p.metrage)} en laize {p.laize} cm.</p>}
      <div className="grid grid-cols-2 gap-3">
        <Champ label="Laize du rouleau (cm)">
          <input type="number" inputMode="numeric" value={laize} onChange={(e) => setLaize(Number(e.target.value))} style={inputStyle} />
        </Champ>
        <Champ label="Prix au mètre (€)">
          <input type="number" step="0.1" inputMode="decimal" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="12,90" style={inputStyle} />
        </Champ>
      </div>
      <label className="flex items-center gap-2 mb-4" style={{ fontSize: 14 }}>
        <input type="checkbox" checked={marge} onChange={(e) => setMarge(e.target.checked)} style={{ width: 17, height: 17, accentColor: C.bleu }} />
        Ajouter 10 % de marge
      </label>
      <div className="rounded-lg" style={{ background: C.bleu, color: "#fff", padding: "18px 20px" }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Demande</div>
        <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>
          {besoin > 0 ? `${arr(besoin)} m` : "—"}
        </div>
        {total > 0 && <div style={{ fontSize: 14.5, opacity: 0.9, marginTop: 6 }}>soit {fmtE(total)} au total</div>}
      </div>
    </div>
  );
}

function Doublon({ tissus }) {
  const [matiere, setMatiere] = useState("");
  const [couleur, setCouleur] = useState("");
  const cherche = matiere || couleur;
  const trouves = tissus.filter((t) => (!matiere || t.matiere === matiere) && (!couleur || t.couleur === couleur));
  const total = trouves.reduce((s, t) => s + Number(t.metrage), 0);

  return (
    <div>
      <Champ label="Matière">
        <div className="flex flex-wrap gap-2">
          {MATIERES.slice(0, 8).map((m) => (
            <button key={m} onClick={() => setMatiere(matiere === m ? "" : m)} className="rounded-full"
              style={{ padding: "6px 12px", fontSize: 13, border: `1px solid ${matiere === m ? C.bleu : C.line}`, background: matiere === m ? C.bleu : C.surface, color: matiere === m ? "#fff" : C.inkSoft }}>
              {m}
            </button>
          ))}
        </div>
      </Champ>
      <Champ label="Couleur approchante">
        <div className="flex flex-wrap gap-2">
          {COULEURS.map((c) => (
            <button key={c} onClick={() => setCouleur(couleur === c ? "" : c)} className="rounded-md flex items-center justify-center"
              style={{ width: 32, height: 32, background: c, border: `1px solid ${C.line}`, outline: couleur === c ? `2px solid ${C.accent}` : "none", outlineOffset: 2 }}
              aria-label={`Couleur ${c}`}>
              {couleur === c && <Check size={14} color={c === "#FFFFFF" || c === "#E8E2D6" ? C.ink : "#fff"} />}
            </button>
          ))}
        </div>
      </Champ>
      {!cherche ? (
        <p style={{ fontSize: 14, color: C.inkSoft }}>Choisis une matière ou une couleur.</p>
      ) : trouves.length === 0 ? (
        <div className="rounded-lg flex items-center gap-2" style={{ background: C.ground, padding: "14px 16px", fontSize: 15 }}>
          <Check size={18} color={C.ok} /> Rien de ce genre chez toi. Fonce.
        </div>
      ) : (
        <div className="rounded-lg" style={{ background: C.ground, padding: "14px 16px" }}>
          <div className="flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
            <CircleAlert size={18} color={C.alerte} /> Tu as déjà {fmtM(total)}
          </div>
          {trouves.map((t) => (
            <div key={t.id} className="flex items-center gap-2" style={{ marginTop: 7, fontSize: 14 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: t.couleur, border: `1px solid ${C.line}`, flexShrink: 0 }} />
              {t.nom} — {fmtM(t.metrage)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- SAISIE RAPIDE ------------------------ */

function SaisieRapide({ prefill, onSave, onClose }) {
  const [quoi, setQuoi] = useState(prefill.quoi || "tissu");
  const typeDevine = (() => {
    const l = (prefill.pour || "").toLowerCase();
    return TYPES_MERCERIE.find((t) => l.includes(t.toLowerCase().replace(/s$/, ""))) || "Fil";
  })();
  const [f, setF] = useState({
    nom: prefill.nom || "", metrage: "", prix: "", couleur: "#2E5A8A",
    matiere: "Coton", laize: 140, boutique: "", notes: "", courseId: prefill.courseId,
  });
  const [m, setM] = useState({ type: prefill.quoi === "mercerie" ? typeDevine : "Fil", nom: "", quantite: prefill.quantite || "", couleur: "#2E5A8A", notes: "" });
  const [pt, setPt] = useState({ nom: prefill.quoi === "patron" ? prefill.nom || "" : "", marque: "", categorie: "Haut", metrage: "", laize: 140, taille: "" });

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valide = quoi === "tissu" ? f.nom.trim() && f.metrage !== "" : quoi === "mercerie" ? m.nom.trim() : pt.nom.trim();

  const manque = quoi === "tissu"
    ? (!f.nom.trim() ? "le nom du tissu" : f.metrage === "" ? "le métrage acheté" : "")
    : quoi === "mercerie" ? (!m.nom.trim() ? "la description" : "") : (!pt.nom.trim() ? "le nom du patron" : "");

  const enregistrer = () => {
    if (!valide) return;
    if (quoi === "tissu") onSave("tissu", { ...f, metrage: Number(f.metrage) });
    else if (quoi === "mercerie") onSave("mercerie", { ...m, courseId: prefill.courseId });
    else onSave("patron", { ...pt, metrage: pt.metrage === "" ? 0 : Number(pt.metrage) });
  };

  const nuancier = (valeur, changer) => (
    <div className="flex flex-wrap gap-2">
      {COULEURS.map((c) => (
        <button key={c} onClick={() => changer(c)} className="rounded-md flex items-center justify-center"
          style={{ width: 34, height: 34, background: c, border: `1px solid ${C.line}`, outline: valeur === c ? `2px solid ${C.accent}` : "none", outlineOffset: 2 }}
          aria-label={`Couleur ${c}`}>
          {valeur === c && <Check size={15} color={c === "#FFFFFF" || c === "#E8E2D6" ? C.ink : "#fff"} />}
        </button>
      ))}
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>Saisie éclair</TitreFeuille>
        <p style={{ ...mono(9.5, C.inkSoft, ".06em"), marginTop: 6, marginBottom: 16, lineHeight: 1.5 }}>
          {prefill.pour ? `Pour : ${prefill.pour}. Nomme le tissu que tu as pris et son métrage.` : "Le strict nécessaire. Tu peaufineras au calme."}
        </p>

        {!prefill.courseId && (
          <div className="flex gap-5 mb-5" style={{ borderBottom: `0.5px solid ${C.line}` }}>
            {[["tissu", "Tissu"], ["mercerie", "Mercerie"], ["patron", "Patron"]].map(([id, label]) => (
              <button key={id} onClick={() => setQuoi(id)} className="rounded-none"
                style={{
                  padding: "0 0 9px", fontSize: 14.5, fontWeight: quoi === id ? 600 : 400,
                  color: quoi === id ? C.ink : C.inkSoft, marginBottom: -1,
                  borderBottom: quoi === id ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {quoi === "tissu" && (
          <>
            <Champ label="C'est quoi ?">
              <input autoFocus value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Velours côtelé vert" style={inputStyle} />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Métrage acheté (m)">
                <input type="number" step="0.1" inputMode="decimal" value={f.metrage}
                  onChange={(e) => set("metrage", e.target.value === "" ? "" : Number(e.target.value))} placeholder="2,5" style={inputStyle} />
              </Champ>
              <Champ label="Prix au mètre (€)">
                <input type="number" step="0.1" inputMode="decimal" value={f.prix}
                  onChange={(e) => set("prix", e.target.value === "" ? "" : Number(e.target.value))} placeholder="12,90" style={inputStyle} />
              </Champ>
            </div>
            <Champ label="Couleur">{nuancier(f.couleur, (c) => set("couleur", c))}</Champ>
          </>
        )}

        {quoi === "mercerie" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Type">
                <select value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })} style={inputStyle}>
                  {TYPES_MERCERIE.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Champ>
              <Champ label="Combien ?">
                <input value={m.quantite} onChange={(e) => setM({ ...m, quantite: e.target.value })} placeholder="6, 2 bobines…" style={inputStyle} />
              </Champ>
            </div>
            <Champ label="Description">
              <input autoFocus value={m.nom} onChange={(e) => setM({ ...m, nom: e.target.value })} placeholder="Nacre 15 mm, Gütermann écru…" style={inputStyle} />
            </Champ>
            <Champ label="Couleur">{nuancier(m.couleur, (c) => setM({ ...m, couleur: c }))}</Champ>
          </>
        )}

        {quoi === "patron" && (
          <>
            <Champ label="Nom du patron">
              <input autoFocus value={pt.nom} onChange={(e) => setPt({ ...pt, nom: e.target.value })} placeholder="Cherry Hills" style={inputStyle} />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Marque">
                <input value={pt.marque} onChange={(e) => setPt({ ...pt, marque: e.target.value })} placeholder="Deer & Doe" style={inputStyle} />
              </Champ>
              <Champ label="Catégorie">
                <select value={pt.categorie} onChange={(e) => setPt({ ...pt, categorie: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Champ>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Métrage requis (m)">
                <input type="number" step="0.1" inputMode="decimal" value={pt.metrage}
                  onChange={(e) => setPt({ ...pt, metrage: e.target.value })} placeholder="sur la pochette" style={inputStyle} />
              </Champ>
              <Champ label="Pour une laize de (cm)">
                <input type="number" inputMode="numeric" value={pt.laize} onChange={(e) => setPt({ ...pt, laize: Number(e.target.value) })} style={inputStyle} />
              </Champ>
            </div>
          </>
        )}

        <button onClick={enregistrer} disabled={!valide} className="w-full rounded-lg"
          style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Enregistrer
        </button>
        {manque && (
          <p style={{ ...mono(9, C.alerte, ".08em"), marginTop: 9, textAlign: "center", textTransform: "uppercase" }}>
            Il manque {manque}
          </p>
        )}
      </div>
    </Overlay>
  );
}

/* ------------------------------ RÉSERVE --------------------------- */

function Reserve({ tissus, mercerie, onOpen, onAdd, onOpenMercerie, onAddMercerie }) {
  const [vue, setVue] = useState("tissus");
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("Tout");
  const [epuises, setEpuises] = useState(false);
  const actifs = tissus.filter((t) => !t.epuise);
  const finis = tissus.filter((t) => t.epuise);
  const source = epuises ? finis : actifs;
  const matieres = useMemo(() => ["Tout", ...Array.from(new Set(actifs.map((t) => t.matiere)))], [tissus]);
  const liste = source.filter((t) => (filtre === "Tout" || t.matiere === filtre) && t.nom.toLowerCase().includes(q.toLowerCase()));
  const total = actifs.reduce((s, t) => s + Number(t.metrage || 0), 0);
  const valeur = actifs.reduce((s, t) => s + Number(t.metrage || 0) * Number(t.prix || 0), 0);
  const incomplets = actifs.filter((t) => t.aCompleter).length;

  const bascule = (id, label) => (
    <button onClick={() => setVue(id)}
      style={{
        ...mono(9.5, vue === id ? C.ink : C.inkSoft, ".1em"),
        padding: "0 0 9px", marginBottom: -1, textTransform: "uppercase",
        borderBottom: vue === id ? `1.5px solid ${C.ink}` : "1.5px solid transparent",
      }}>
      {label}
    </button>
  );

  return (
    <div className="px-4 pt-6">

      <div className="flex gap-5 mb-5" style={{ borderBottom: `0.5px solid ${C.line}` }}>
        {bascule("tissus", "Tissus")}
        {bascule("mercerie", "Mercerie")}
      </div>

      {vue === "mercerie" ? (
        <Mercerie mercerie={mercerie} onOpen={onOpenMercerie} onAdd={onAddMercerie} />
      ) : (
        <VueTissus {...{ tissus: actifs, liste, matieres, q, setQ, filtre, setFiltre, total, valeur, incomplets, onOpen, onAdd, epuises, setEpuises, nbEpuises: finis.length }} />
      )}
    </div>
  );
}

function VueTissus({ tissus, liste, matieres, q, setQ, filtre, setFiltre, total, valeur, incomplets, onOpen, onAdd, epuises, setEpuises, nbEpuises }) {
  const [vue, setVue] = useState("liste");

  return (
    <div>
      <Entete section="RÉSERVE" valeur={total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        unite="m" droite={`${tissus.length} réf · ${Math.round(valeur)} €`}>
        <Bascule vue={vue} setVue={setVue} />
      </Entete>

      <div className="relative" style={{ marginBottom: 10 }}>
        <Search size={15} style={{ position: "absolute", left: 2, top: 10, color: C.inkSoft }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un tissu" className="w-full outline-none"
          style={{ ...mono(12, C.ink, ".04em"), background: "transparent", border: "none", borderBottom: `0.5px solid ${C.line}`, padding: "8px 2px 8px 24px" }} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1" style={{ marginBottom: 14 }}>
        {matieres.map((m) => (
          <button key={m} onClick={() => setFiltre(m)} className="whitespace-nowrap"
            style={{ ...mono(9, filtre === m ? C.ink : C.inkSoft, ".1em"), padding: "4px 0", textTransform: "uppercase" }}>
            {m}
          </button>
        ))}
        {nbEpuises > 0 && (
          <button onClick={() => setEpuises(!epuises)} className="whitespace-nowrap flex-shrink-0"
            style={{ ...mono(9, epuises ? C.ink : C.inkSoft, ".1em"), padding: "4px 0", textTransform: "uppercase" }}>
            Épuisés ({nbEpuises})
          </button>
        )}
      </div>

      {incomplets > 0 && (
        <p style={{ ...mono(9, C.inkSoft, ".1em"), marginBottom: 12 }}>{incomplets} FICHE(S) À COMPLÉTER</p>
      )}

      {liste.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ fontSize: 14.5 }}>Aucun coupon ne correspond.</p>
        </div>
      ) : vue === "liste" ? (
        <div>
          {liste.map((t, i) => (
            <button key={t.id} onClick={() => onOpen(t)} className="w-full text-left flex gap-3"
              style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.line}`, opacity: t.epuise ? 0.45 : 1 }}>
              <Vignette objet={t} taille={78} />
              <span className="flex-1 flex flex-col justify-center" style={{ minWidth: 0 }}>
                <span className="flex items-baseline gap-1.5">
                  <span style={mono(8.5, C.inkSoft, ".06em")}>{ref(i)}</span>
                  <span style={{ fontSize: 14, color: C.ink }}>{t.nom}</span>
                </span>
                <span className="flex items-baseline" style={{ marginTop: 6 }}>
                  <span style={mono(8.5, C.inkSoft, ".08em")}>{t.matiere.toUpperCase()} · L.{t.laize}</span>
                  <Points />
                  <span style={mono(12, C.ink, "0")}>{Number(t.metrage).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
                <span style={{ marginTop: 7 }}><Entretien matiere={t.matiere} perso={t.entretien} /></span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {liste.map((t, i) => (
            <button key={t.id} onClick={() => onOpen(t)} className="text-left" style={{ opacity: t.epuise ? 0.45 : 1 }}>
              <Vignette objet={t} carre />
              <span className="flex items-baseline gap-1.5" style={{ marginTop: 7 }}>
                <span style={mono(8, C.inkSoft, ".06em")}>{ref(i)}</span>
                <span style={{ fontSize: 12.5, color: C.ink }}>{t.nom}</span>
              </span>
              <span className="flex items-baseline" style={{ marginTop: 3 }}>
                <span style={mono(8, C.inkSoft, ".06em")}>{t.matiere.toUpperCase()}</span>
                <Points />
                <span style={mono(10.5, C.ink, "0")}>{Number(t.metrage).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
              <span className="flex" style={{ marginTop: 5 }}><Entretien matiere={t.matiere} perso={t.entretien} taille={12} /></span>
            </button>
          ))}
        </div>
      )}

      <BoutonAjout label="Ajouter un tissu" onClick={onAdd} />
    </div>
  );
}

function Vignette({ objet, taille, carre }) {
  const photo = photosDe(objet)[0];
  const style = carre
    ? { width: "100%", aspectRatio: "1", display: "block" }
    : { width: taille, height: taille, flexShrink: 0 };
  if (photo) return <img src={photo} alt="" style={{ ...style, objectFit: "cover" }} />;
  return <span style={{ ...style, background: objet.couleur || C.ground }} />;
}

function Mercerie({ mercerie, onOpen, onAdd }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("Tout");
  const [epuises, setEpuises] = useState(false);

  const actifs = mercerie.filter((m) => !m.epuise);
  const finis = mercerie.filter((m) => m.epuise);
  const source = epuises ? finis : actifs;
  const types = useMemo(() => ["Tout", ...TYPES_MERCERIE.filter((t) => actifs.some((m) => m.type === t))], [mercerie]);
  const liste = source.filter(
    (m) => (type === "Tout" || m.type === type) &&
      (m.nom.toLowerCase().includes(q.toLowerCase()) || (m.notes || "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="relative" style={{ marginBottom: 10 }}>
        <Search size={15} style={{ position: "absolute", left: 2, top: 10, color: C.inkSoft }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher : nacre, bleu nuit, 20 cm…" className="w-full outline-none"
          style={{ ...mono(12, C.ink, ".04em"), background: "transparent", border: "none", borderBottom: `0.5px solid ${C.line}`, padding: "8px 2px 8px 24px" }} />
      </div>

      <div className="flex gap-5 mb-5 overflow-x-auto pb-1">
        {types.map((t) => (
          <button key={t} onClick={() => setType(t)} className="whitespace-nowrap"
            style={{ ...mono(9, type === t ? C.ink : C.inkSoft, ".1em"), padding: "4px 0", textTransform: "uppercase" }}>
            {t}
          </button>
        ))}
        {finis.length > 0 && (
          <button onClick={() => setEpuises(!epuises)} className="rounded-full whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
            style={{ padding: "6px 13px", fontSize: 13, border: `1px dashed ${epuises ? C.ink : C.line}`, background: epuises ? C.ink : C.surface, color: epuises ? "#fff" : C.inkSoft }}>
            <Archive size={12} /> Épuisés ({finis.length})
          </button>
        )}
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ fontSize: 15 }}>{epuises ? "Rien d'épuisé de ce genre." : "Rien de ce genre dans ton tiroir."}</p>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>Le bouton jaune ajoute un fil, des boutons, une fermeture…</p>
        </div>
      ) : (
        liste.map((m) => (
          <button key={m.id} onClick={() => onOpen(m)} className="w-full text-left flex items-center gap-3"
            style={{ borderBottom: `0.5px solid ${C.line}`, padding: "12px 2px" }}>
            <span style={{ width: 40, height: 40, background: m.couleur, flexShrink: 0, opacity: m.epuise ? 0.45 : 1 }} />
            <span className="flex-1 flex items-baseline" style={{ minWidth: 0, opacity: m.epuise ? 0.45 : 1 }}>
              <span style={{ fontSize: 14, color: C.ink }}>{m.nom}</span>
              <Points />
              <span style={mono(8.5, C.inkSoft, ".08em")}>{m.type.toUpperCase()}</span>
            </span>
            {m.epuise ? (
              <span className="flex-shrink-0" style={{ ...mono(8, C.page, ".08em"), background: C.ink, padding: "3px 6px", marginLeft: 10 }}>ÉPUISÉ</span>
            ) : m.quantite ? (
              <span className="flex-shrink-0" style={{ ...mono(11.5, C.ink, "0"), marginLeft: 10 }}>{m.quantite}</span>
            ) : null}
          </button>
        ))
      )}

      <BoutonAjout label="Ajouter une fourniture" onClick={onAdd} />
    </div>
  );
}

function FormulaireMercerie({ item, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    id: item.id, type: item.type || "Fil", nom: item.nom || "",
    couleur: item.couleur || "#2E5A8A", quantite: item.quantite || "", notes: item.notes || "",
    epuise: !!item.epuise,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valide = f.nom.trim();

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>{item.id ? "Modifier" : "Nouvelle fourniture"}</TitreFeuille>

        <div className="grid grid-cols-2 gap-3">
          <Champ label="Type">
            <select value={f.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
              {TYPES_MERCERIE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Champ>
          <Champ label="Combien ?">
            <input value={f.quantite} onChange={(e) => set("quantite", e.target.value)} placeholder="12, 2 bobines, 3 m…" style={inputStyle} />
          </Champ>
        </div>

        <Champ label="Description">
          <input autoFocus={!item.id} value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Nacre 15 mm, Gütermann bleu nuit…" style={inputStyle} />
        </Champ>

        <Champ label="Couleur">
          <div className="flex flex-wrap gap-2">
            {COULEURS.map((c) => (
              <button key={c} onClick={() => set("couleur", c)} className="rounded-md flex items-center justify-center"
                style={{ width: 34, height: 34, background: c, border: `1px solid ${C.line}`, outline: f.couleur === c ? `2px solid ${C.accent}` : "none", outlineOffset: 2 }}
                aria-label={`Couleur ${c}`}>
                {f.couleur === c && <Check size={15} color={c === "#FFFFFF" || c === "#E8E2D6" ? C.ink : "#fff"} />}
              </button>
            ))}
          </div>
        </Champ>

        <Champ label="Notes">
          <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
            placeholder="Dans la boîte à couture, récupérés sur…" style={{ ...inputStyle, resize: "none" }} />
        </Champ>

        {item.id && (
          <button onClick={() => set("epuise", !f.epuise)} className="w-full rounded-lg flex items-center justify-center gap-2 mb-4"
            style={{ border: `1px solid ${f.epuise ? C.ink : C.line}`, background: f.epuise ? C.ink : C.surface, color: f.epuise ? "#fff" : C.inkSoft, padding: 12, fontSize: 15 }}>
            <Archive size={16} /> {f.epuise ? "Épuisé — rangé de côté" : "Marquer comme épuisé"}
          </button>
        )}

        <div className="flex gap-2">
          <button onClick={() => valide && onSave(f)} disabled={!valide} className="flex-1 rounded-lg"
            style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {item.id ? "Enregistrer" : "Ajouter au tiroir"}
          </button>
          {item.id && (
            <button onClick={() => onDelete(item.id)} className="rounded-lg flex items-center justify-center"
              style={{ border: `1px solid ${C.line}`, background: C.surface, width: 50 }} aria-label="Supprimer">
              <Trash2 size={17} color={C.alerte} />
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function Stat({ valeur, label }) {
  return (
    <div className="flex-1" style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 21, fontWeight: 600 }}>{valeur}</div>
      <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 1 }}>{label}</div>
    </div>
  );
}

/* ------------------------- FICHE / FORMULAIRE TISSU --------------- */

function Fiche({ tissu, onClose, onEdit, onDelete }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: tissu.couleur, height: 150 }} />
      <div style={{ padding: "18px 20px 24px" }}>
        <h2 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{tissu.nom}</h2>
        <p style={{ ...mono(9, C.inkSoft, ".1em"), marginTop: 6, textTransform: "uppercase" }}>{tissu.matiere}{tissu.epuise ? " · épuisé" : ""}</p>
        <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 11 }} />
        {tissu.aCompleter && (
          <div className="rounded-lg flex items-center gap-2" style={{ background: C.ground, padding: "11px 14px", fontSize: 14, marginTop: 14 }}>
            <CircleAlert size={17} color={C.fil} /> Saisi à la volée : laize et provenance à vérifier.
          </div>
        )}
        <div style={{ marginTop: 16 }}><Entretien matiere={tissu.matiere} perso={tissu.entretien} /></div>

        <div className="grid grid-cols-2 gap-y-4 mt-5">
          <Info label="Métrage restant" valeur={fmtM(tissu.metrage)} fort />
          <Info label="Laize" valeur={`${tissu.laize} cm`} />
          <Info label="Prix au mètre" valeur={tissu.prix ? fmtE(tissu.prix) : "—"} />
          <Info label="Valeur du coupon" valeur={tissu.prix ? fmtE(tissu.prix * tissu.metrage) : "—"} />
          <Info label="Provenance" valeur={tissu.boutique || "—"} />
        </div>
        {tissu.notes && <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.5, background: C.ground, padding: "12px 14px", borderRadius: 10 }}>{tissu.notes}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onEdit} className="flex-1 rounded-lg flex items-center justify-center gap-2" style={{ background: C.ink, color: C.page, padding: 13, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
            <Pencil size={16} /> Modifier
          </button>
          <button onClick={onDelete} className="rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, background: C.surface, width: 48 }} aria-label="Supprimer">
            <Trash2 size={17} color={C.alerte} />
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Info({ label, valeur, fort }) {
  return (
    <div>
      <div style={{ ...mono(8.5, C.inkSoft, ".1em"), textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: fort ? 19 : 14.5, color: C.ink, marginTop: 4 }}>{valeur}</div>
    </div>
  );
}

function Formulaire({ tissu, onSave, onClose }) {
  const [f, setF] = useState({
    nom: tissu.nom || "", matiere: tissu.matiere || "Coton", couleur: tissu.couleur || "#2E5A8A",
    laize: tissu.laize || 145, metrage: tissu.metrage ?? "", boutique: tissu.boutique || "",
    prix: tissu.prix ?? "", notes: tissu.notes || "", photos: tissu.photos || [], entretien: tissu.entretien || null, id: tissu.id,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valide = f.nom.trim() && f.metrage !== "";

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "10px 20px 24px" }}>
        <TitreFeuille>{tissu.id ? "Modifier le coupon" : "Nouveau coupon"}</TitreFeuille>
        <Champ label="Nom du tissu">
          <input value={f.nom} onChange={(e) => set("nom", e.target.value)} style={inputStyle} />
        </Champ>
        <Champ label="Matière">
          <select value={f.matiere} onChange={(e) => set("matiere", e.target.value)} style={inputStyle}>
            {MATIERES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Champ>
        <Champ label="Couleur dominante">
          <div className="flex flex-wrap gap-2">
            {COULEURS.map((c) => (
              <button key={c} onClick={() => set("couleur", c)} className="rounded-md flex items-center justify-center"
                style={{ width: 34, height: 34, background: c, border: `1px solid ${C.line}`, outline: f.couleur === c ? `2px solid ${C.accent}` : "none", outlineOffset: 2 }}
                aria-label={`Couleur ${c}`}>
                {f.couleur === c && <Check size={15} color={c === "#FFFFFF" || c === "#E8E2D6" ? C.ink : "#fff"} />}
              </button>
            ))}
          </div>
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Métrage (m)">
            <input type="number" step="0.1" inputMode="decimal" value={f.metrage}
              onChange={(e) => set("metrage", e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
          </Champ>
          <Champ label="Laize (cm)">
            <input type="number" inputMode="numeric" value={f.laize} onChange={(e) => set("laize", Number(e.target.value))} style={inputStyle} />
          </Champ>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Boutique">
            <input value={f.boutique} onChange={(e) => set("boutique", e.target.value)} style={inputStyle} />
          </Champ>
          <Champ label="Prix au mètre (€)">
            <input type="number" step="0.1" inputMode="decimal" value={f.prix}
              onChange={(e) => set("prix", e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
          </Champ>
        </div>
        <div className="mb-5">
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.inkSoft }}>Entretien</span>
            {f.entretien && (
              <button onClick={() => set("entretien", null)} style={mono(9, C.inkSoft, ".08em")}>REVENIR À LA MATIÈRE</button>
            )}
          </div>
          <ReglagesEntretien valeurs={entretienDe(f)} onChange={(k, v) => set("entretien", { ...(f.entretien || {}), [k]: v })} />
          <span style={{ ...mono(9, C.inkSoft, ".08em"), display: "block", marginTop: 8 }}>
            {f.entretien ? "RÉGLÉ À LA MAIN" : `PROPOSÉ D'APRÈS : ${f.matiere.toUpperCase()}`}
          </span>
        </div>

        <div className="mb-4">
          <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 6, textTransform: "uppercase" }}>Photos du tissu</span>
          <Galerie photos={photosDe(f)} onRetirer={(i) => set("photos", photosDe(f).filter((_, j) => j !== i))}
            onAjouter={(e) => { if (e.target.files) lirePhotos(e.target.files, (d) => setF((p) => ({ ...p, photos: [...photosDe(p), d] }))); e.target.value = ""; }} />
        </div>

        <Champ label="Notes">
          <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
        </Champ>
        <button onClick={() => valide && onSave({ ...f, metrage: Number(f.metrage), aCompleter: false })} disabled={!valide}
          className="w-full rounded-lg mt-2" style={{ background: valide ? C.ink : C.line, color: valide ? C.page : C.inkSoft, padding: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          {tissu.id ? "Enregistrer les modifications" : "Ajouter à ma réserve"}
        </button>
      </div>
    </Overlay>
  );
}

const inputStyle = {
  width: "100%", background: "transparent", border: "none", borderBottom: `0.5px solid ${C.line}`,
  borderRadius: 0, padding: "9px 2px", fontSize: 15, color: C.ink, outline: "none",
};

function BoutonAjout({ label, onClick }) {
  return (
    <div className="fixed left-0 right-0 flex justify-center px-4" style={{ bottom: "calc(66px + env(safe-area-inset-bottom))", zIndex: 45, pointerEvents: "none" }}>
      <button onClick={onClick} className="flex items-center gap-2" aria-label={label}
        style={{ background: C.ink, color: C.page, padding: "11px 18px", fontSize: 13, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", borderRadius: 0,
          boxShadow: "0 4px 14px rgba(23,23,15,.18)", pointerEvents: "auto" }}>
        <Plus size={20} strokeWidth={2.4} /> {label}
      </button>
    </div>
  );
}

function Trame({ taille = 96 }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" fill="none" style={{ color: C.ink }}>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="square">
        {[22, 36, 50, 64, 78].map((x, i) => (
          <line key={x} x1={x} y1="16" x2={x} y2="62" className="fil" style={{ animationDelay: `${i * 70}ms` }} />
        ))}
      </g>
      <g stroke={C.page} strokeWidth="7">
        <line x1="14" y1="30" x2="86" y2="30" /><line x1="14" y1="50" x2="86" y2="50" />
      </g>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="square">
        <line x1="14" y1="30" x2="86" y2="30" strokeDasharray="14 14" className="trame" style={{ animationDelay: "380ms" }} />
        <line x1="14" y1="50" x2="86" y2="50" strokeDasharray="14 14" strokeDashoffset="14" className="trame" style={{ animationDelay: "480ms" }} />
        <path d="M22 62 a28 22 0 0 0 56 0" fill="none" className="courbe" style={{ animationDelay: "600ms" }} />
      </g>
    </svg>
  );
}

function Demarrage({ onFini }) {
  useEffect(() => {
    const t = setTimeout(onFini, 1400);
    return () => clearTimeout(t);
  }, [onFini]);

  return (
    <div onClick={onFini} className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: C.page, zIndex: 80 }}>
      <div className="apparait" style={{ fontFamily: '"Climate Crisis", sans-serif', fontSize: 56, color: "#C98F3E", lineHeight: 0.9 }}>uttu</div>
      <div style={{ ...mono(9, C.inkSoft, ".22em"), marginTop: 16 }} className="apparait tard">TISSUS · PATRONS · PROJETS</div>
    </div>
  );
}

function Points() {
  return <span style={{ flex: 1, borderBottom: `1px dotted ${C.pointille}`, margin: "0 6px", transform: "translateY(-3px)" }} />;
}

function Entete({ section, valeur, unite, droite, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex items-center justify-between">
        <span style={mono(9, C.encre, ".18em")}>UTTU / {section}</span>
        {children}
      </div>
      <div className="flex items-baseline" style={{ marginTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 27, color: C.ink, letterSpacing: "-0.02em" }}>{valeur}</span>
        {unite && <span style={{ ...mono(11), marginLeft: 5 }}>{unite}</span>}
        <Points />
        <span style={mono(11)}>{droite}</span>
      </div>
      <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 9 }} />
    </div>
  );
}

function Bascule({ vue, setVue }) {
  return (
    <span className="flex gap-3">
      <button onClick={() => setVue("liste")} aria-label="Vue en liste" style={{ color: vue === "liste" ? C.ink : C.faible }}>
        <List size={16} strokeWidth={1.8} />
      </button>
      <button onClick={() => setVue("carres")} aria-label="Vue en carrés" style={{ color: vue === "carres" ? C.ink : C.faible }}>
        <LayoutGrid size={16} strokeWidth={1.8} />
      </button>
    </span>
  );
}

/* --- symboles d'entretien, déduits de la matière --- */
const ENTRETIEN = {
  Coton: { temp: 40, fer: 3, sechage: "suspendu" },
  Popeline: { temp: 40, fer: 3, sechage: "suspendu" },
  Jersey: { temp: 30, fer: 2, sechage: "plat" },
  Sweat: { temp: 30, fer: 2, sechage: "plat" },
  Lin: { temp: 30, fer: 3, sechage: "plat" },
  Viscose: { temp: 30, fer: 1, sechage: "plat" },
  Denim: { temp: 40, fer: 3, sechage: "suspendu" },
  Laine: { temp: 0, fer: 1, sechage: "plat" },
  Satin: { temp: 30, fer: 1, sechage: "suspendu" },
  Velours: { temp: 30, fer: 1, sechage: "suspendu" },
  Autre: { temp: 30, fer: 2, sechage: "suspendu" },
};

function Cuve({ temp }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2.5 8.5c2-2 3.5 .8 5.5-.4s3.5 1 5.5 .2 4-1.4 5.5 .2l-1.6 11.5H4.1z" />
      {temp === 0
        ? <path d="M9 13.5c1.6-1 3.4 1 5 0" strokeWidth="1.4" />
        : <text x="12" y="17.4" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none" fontFamily={MONO}>{temp}</text>}
    </svg>
  );
}

function Fer({ points }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2.5 18h19c-.6-6.5-3.4-10-8.2-10-3.4 0-5.6 1.3-7 3.4z" />
      {[...Array(points)].map((_, i) => (
        <circle key={i} cx={12 + (i - (points - 1) / 2) * 4} cy="14.4" r="1" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

function Sechage({ type }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="4" width="18" height="16" />
      {type === "plat"
        ? <path d="M7 12h10" />
        : <path d="M3 4l9 6 9-6" />}
    </svg>
  );
}

const entretienDe = (t) => ({ ...(ENTRETIEN[t.matiere] || ENTRETIEN.Autre), ...(t.entretien || {}) });

function Entretien({ matiere, perso, taille = 14 }) {
  const e = { ...(ENTRETIEN[matiere] || ENTRETIEN.Autre), ...(perso || {}) };
  return (
    <span className="flex items-center" style={{ gap: 6, color: C.encre, height: taille }}>
      <Cuve temp={e.temp} /><Fer points={e.fer} /><Sechage type={e.sechage} />
    </span>
  );
}

function ReglagesEntretien({ valeurs, onChange }) {
  const ligne = (titre, options, cle, rendu) => (
    <div className="flex items-center gap-3" style={{ padding: "9px 0", borderBottom: `0.5px solid ${C.line}` }}>
      <span style={{ ...mono(9, C.inkSoft, ".1em"), width: 72, flexShrink: 0 }}>{titre}</span>
      <span className="flex gap-2 flex-wrap">
        {options.map((o) => {
          const actif = valeurs[cle] === o;
          return (
            <button key={String(o)} onClick={() => onChange(cle, o)} className="flex items-center justify-center"
              style={{ width: 36, height: 32, border: `${actif ? 1 : 0.5}px solid ${actif ? C.ink : C.pointille}`, color: actif ? C.ink : C.inkSoft }}
              aria-label={`${titre} ${o}`}>
              {rendu(o)}
            </button>
          );
        })}
      </span>
    </div>
  );

  return (
    <div>
      {ligne("LAVAGE", [0, 30, 40, 60], "temp", (o) => <Cuve temp={o} />)}
      {ligne("FER", [1, 2, 3], "fer", (o) => <Fer points={o} />)}
      {ligne("SÉCHAGE", ["plat", "suspendu"], "sechage", (o) => <Sechage type={o} />)}
    </div>
  );
}

function TitreFeuille({ children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>{children}</h2>
      <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 9 }} />
    </div>
  );
}

function Champ({ label, children }) {
  return (
    <label className="block mb-4">
      <span style={{ ...mono(9, C.inkSoft, ".1em"), display: "block", marginBottom: 7, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ background: C.voile, zIndex: 50 }} onClick={onClose}>
      <div className="w-full rounded-t-2xl overflow-y-auto" style={{ background: C.surface, maxWidth: 560, maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end" style={{ position: "sticky", top: 0 }}>
          <button onClick={onClose} className="rounded-full flex items-center justify-center"
            style={{ margin: 10, width: 30, height: 30, background: C.surface, border: `0.5px solid ${C.line}` }} aria-label="Fermer">
            <X size={17} />
          </button>
        </div>
        <div style={{ marginTop: -52 }}>{children}</div>
      </div>
    </div>
  );
}

function Nav({ tab, setTab, badge }) {
  const onglets = [
    { id: "magasin", label: "Magasin", Icone: ShoppingBasket },
    { id: "reserve", label: "Réserve", Icone: Layers },
    { id: "patrons", label: "Patrons", Icone: Ruler },
    { id: "projets", label: "Projets", Icone: Shirt },
    { id: "envies", label: "Envies", Icone: Heart },
  ];
  return (
    <nav className="fixed left-0 right-0 bottom-0 flex justify-center" style={{ background: C.page, borderTop: `1.5px solid ${C.ink}`, zIndex: 40 }}>
      <div className="flex items-center justify-around w-full" style={{ maxWidth: 560, padding: "11px 10px calc(15px + env(safe-area-inset-bottom))" }}>
        {onglets.map(({ id, label, Icone }) => {
          const actif = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} className="flex items-center gap-1.5"
              style={{ position: "relative", color: actif ? C.encre : C.faible, padding: "4px 6px" }} aria-label={label}>
              <Icone size={20} strokeWidth={actif ? 2 : 1.6} />
              {actif && <span style={mono(9, C.encre, ".08em")}>{label.toUpperCase()}</span>}
              {id === "magasin" && badge > 0 && !actif && (
                <span className="rounded-full" style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, background: C.encre }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}