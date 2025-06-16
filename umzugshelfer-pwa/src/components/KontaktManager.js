import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  UserPlus,
  Edit3,
  Trash2,
  Phone,
  XCircle,
  Briefcase,
  Building,
  Users as FriendsIcon,
  HelpCircle as OtherIcon,
  Search,
  MapPin, // Hinzugefügt für Adress-Icon
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext"; // ThemeContext importieren

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const kontaktTypMeta = {
  Möbelpacker: {
    icon: <Briefcase size={14} />,
    light: { color: "bg-blue-100 text-blue-700", avatarColor: "bg-blue-500" },
    dark: { color: "bg-blue-500/30 text-blue-300", avatarColor: "bg-blue-500" },
  },
  Handwerker: {
    icon: <UserPlus size={14} />,
    light: {
      color: "bg-green-100 text-green-700",
      avatarColor: "bg-green-500",
    },
    dark: {
      color: "bg-green-500/30 text-green-300",
      avatarColor: "bg-green-500",
    },
  },
  Behörde: {
    icon: <Building size={14} />,
    light: { color: "bg-red-100 text-red-700", avatarColor: "bg-red-500" },
    dark: { color: "bg-red-500/30 text-red-300", avatarColor: "bg-red-500" },
  },
  "Freund/Familie": {
    icon: <FriendsIcon size={14} />,
    light: {
      color: "bg-purple-100 text-purple-700",
      avatarColor: "bg-purple-500",
    },
    dark: {
      color: "bg-purple-500/30 text-purple-300",
      avatarColor: "bg-purple-500",
    },
  },
  Mömax: {
    icon: <Building size={14} />,
    light: { color: "bg-red-100 text-red-700", avatarColor: "bg-red-500" },
    dark: { color: "bg-red-500/30 text-red-300", avatarColor: "bg-red-500" },
  },
  XXXLutz: {
    icon: <Building size={14} />,
    light: { color: "bg-red-100 text-red-700", avatarColor: "bg-red-500" },
    dark: { color: "bg-red-500/30 text-red-300", avatarColor: "bg-red-500" },
  },
  IKEA: {
    icon: <Building size={14} />,
    light: { color: "bg-red-100 text-red-700", avatarColor: "bg-red-500" },
    dark: { color: "bg-red-500/30 text-red-300", avatarColor: "bg-red-500" },
  },
  Bettenreither: {
    icon: <Building size={14} />,
    light: { color: "bg-red-100 text-red-700", avatarColor: "bg-red-500" },
    dark: { color: "bg-red-500/30 text-red-300", avatarColor: "bg-red-500" },
  },
  Sonstiges: {
    icon: <OtherIcon size={14} />,
    light: { color: "bg-gray-200 text-gray-700", avatarColor: "bg-gray-500" },
    dark: { color: "bg-gray-600/40 text-gray-300", avatarColor: "bg-gray-500" },
  },
};

const getKontaktTypMetaInfo = (typ, theme) => {
  const meta = kontaktTypMeta[typ] || kontaktTypMeta.Sonstiges;
  return theme === "dark" ? meta.dark : meta.light;
};

const kontaktTypenFürFilter = ["Alle", ...Object.keys(kontaktTypMeta)];

const KontaktManager = ({ session }) => {
  const userId = session?.user?.id;
  const { theme } = useTheme(); // Theme aus Context holen
  const [kontakte, setKontakte] = useState([]);
  const [name, setName] = useState("");
  const [typ, setTyp] = useState("Möbelpacker");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState(""); // Hinzugefügt für Adresse
  const [notiz, setNotiz] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKontaktId, setEditingKontaktId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTyp, setFilterTyp] = useState("Alle");
  const [selectedMapService, setSelectedMapService] = useState(
    localStorage.getItem("umzugshelferMapService") || "google"
  );

  const handleMapServiceChange = (service) => {
    setSelectedMapService(service);
    localStorage.setItem("umzugshelferMapService", service);
  };

  const generateMapLink = (address, service) => {
    const encodedAddress = encodeURIComponent(address);
    switch (service) {
      case "apple":
        return `http://maps.apple.com/?q=${encodedAddress}`;
      case "osm":
        return `https://www.openstreetmap.org/search?query=${encodedAddress}`;
      case "google":
      default:
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
  };

  const fetchKontakte = useCallback(async () => {
    if (!userId) {
      setKontakte([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("kontakte")
        .select("*")
        .eq("user_id", userId)
        .order("typ", { ascending: true })
        .order("name", { ascending: true });
      if (dbError) throw dbError;
      setKontakte(data || []);
    } catch (err) {
      setError("Kontakte nicht geladen.");
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    fetchKontakte();
  }, [fetchKontakte]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (typ) => setFilterTyp(typ);

  const gefilterteUndGruppierteKontakte = kontakte
    .filter(
      (k) =>
        (filterTyp === "Alle" || k.typ === filterTyp) &&
        ((k.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (k.typ?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (k.telefon &&
            k.telefon.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (k.notiz && k.notiz.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .reduce((acc, kontakt) => {
      const typKey = kontakt.typ || "Sonstiges";
      if (!acc[typKey]) acc[typKey] = [];
      acc[typKey].push(kontakt);
      return acc;
    }, {});
  const sortOrderOfTypen = Object.keys(kontaktTypMeta); // Korrigiert
  const resetForm = () => {
    setName("");
    setTyp("Möbelpacker");
    setTelefon("");
    setAdresse(""); // Hinzugefügt
    setNotiz("");
    setEditingKontaktId(null);
    setShowForm(false);
  };
  const handleEditClick = (kontakt) => {
    setEditingKontaktId(kontakt.id);
    setName(kontakt.name);
    setTyp(kontakt.typ);
    setTelefon(kontakt.telefon);
    setAdresse(kontakt.adresse || ""); // Hinzugefügt
    setNotiz(kontakt.notiz || "");
    setShowForm(true);
  };
  const handleAddNewClick = () => {
    if (!userId) {
      alert("Bitte einloggen.");
      return;
    }
    resetForm();
    setEditingKontaktId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !name || !telefon) {
      alert(!userId ? "Nicht eingeloggt." : "Name und Telefon sind Pflicht.");
      return;
    }
    const kontaktDaten = {
      name,
      typ,
      telefon,
      adresse: adresse || null, // Hinzugefügt
      notiz: notiz || null,
      user_id: userId,
    };
    try {
      const { error: opError } = editingKontaktId
        ? await supabase
            .from("kontakte")
            .update(kontaktDaten)
            .match({ id: editingKontaktId, user_id: userId })
        : await supabase.from("kontakte").insert([kontaktDaten]);
      if (opError) throw opError;
      fetchKontakte();
      resetForm();
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    }
  };
  const handleDeleteKontakt = async (id) => {
    if (!userId || !window.confirm("Kontakt löschen?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("kontakte")
        .delete()
        .match({ id: id, user_id: userId });
      if (deleteError) throw deleteError;
      fetchKontakte();
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Lade Kontakte...
        </p>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-8">
        <p className="text-danger-color">{error}</p>
      </div>
    );

  return (
    <div className="space-y-4 p-3 md:p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-2xl font-bold text-light-text-main dark:text-dark-text-main">
          Kontakt-Manager
        </h2>
        <button
          onClick={handleAddNewClick}
          disabled={!userId}
          className="bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg px-3 py-1.5 rounded-md shadow hover:opacity-90 flex items-center space-x-1.5 text-sm disabled:opacity-50 self-start sm:self-center"
        >
          <UserPlus size={18} /> <span>Neuer Kontakt</span>
        </button>
      </div>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-3 py-2 border border-light-border dark:border-dark-border rounded-md focus:ring-1 focus:ring-light-accent-green dark:focus:ring-dark-accent-green shadow-sm text-sm text-light-text-main dark:text-dark-text-main bg-white dark:bg-dark-border placeholder-light-text-secondary dark:placeholder-dark-text-secondary"
        />
        <Search
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary"
          size={18}
        />
      </div>
      <div className="mb-3 p-3 border border-light-border dark:border-dark-border rounded-md bg-light-card-bg/80 dark:bg-dark-card-bg/50">
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Kartendienst für Adressen:
        </label>
        <div className="flex flex-wrap gap-2">
          {["google", "apple", "osm"].map((service) => (
            <button
              key={service}
              onClick={() => handleMapServiceChange(service)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMapService === service
                  ? "bg-light-accent-blue text-white dark:bg-dark-accent-blue dark:text-white shadow-sm"
                  : "bg-light-border text-light-text-secondary dark:bg-dark-border dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {service === "google"
                ? "Google Maps"
                : service === "apple"
                ? "Apple Maps"
                : "OpenStreetMap"}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {kontaktTypenFürFilter.map((typOption) => (
          <button
            key={typOption}
            onClick={() => handleFilterChange(typOption)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterTyp === typOption
                ? "bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg shadow-sm"
                : "bg-light-border text-light-text-secondary dark:bg-dark-border dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {typOption}
          </button>
        ))}
      </div>

      {!userId && !loading && (
        <div className="text-center py-8">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Bitte einloggen.
          </p>
        </div>
      )}

      {userId && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center p-3 z-50">
          <div className="bg-light-card-bg dark:bg-dark-card-bg p-4 rounded-lg shadow-xl w-full max-w-md relative border border-light-border dark:border-dark-border">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-main dark:hover:text-dark-text-main"
            >
              <XCircle size={20} />
            </button>
            <h3 className="text-lg font-semibold text-light-text-main dark:text-dark-text-main mb-4">
              {editingKontaktId ? "Kontakt bearbeiten" : "Neuer Kontakt"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="kontaktName"
                  className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="kontaktName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border-light-border dark:border-dark-border rounded-md text-sm shadow-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:ring-light-accent-green dark:focus:ring-dark-accent-green focus:border-light-accent-green dark:focus:border-dark-accent-green"
                />
              </div>
              <div>
                <label
                  htmlFor="kontaktTyp"
                  className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5"
                >
                  Typ
                </label>
                <select
                  id="kontaktTyp"
                  value={typ}
                  onChange={(e) => setTyp(e.target.value)}
                  className="w-full px-2.5 py-1.5 border-light-border dark:border-dark-border rounded-md text-sm shadow-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main focus:ring-light-accent-green dark:focus:ring-dark-accent-green focus:border-light-accent-green dark:focus:border-dark-accent-green"
                >
                  {Object.keys(kontaktTypMeta).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="kontaktTelefon"
                  className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5"
                >
                  Telefon
                </label>
                <input
                  type="tel"
                  id="kontaktTelefon"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border-light-border dark:border-dark-border rounded-md text-sm shadow-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:ring-light-accent-green dark:focus:ring-dark-accent-green focus:border-light-accent-green dark:focus:border-dark-accent-green"
                />
              </div>
              <div>
                <label
                  htmlFor="kontaktAdresse"
                  className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5"
                >
                  Adresse (optional)
                </label>
                <input
                  type="text"
                  id="kontaktAdresse"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Straße Hausnummer, PLZ Ort"
                  className="w-full px-2.5 py-1.5 border-light-border dark:border-dark-border rounded-md text-sm shadow-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:ring-light-accent-green dark:focus:ring-dark-accent-green focus:border-light-accent-green dark:focus:border-dark-accent-green"
                />
              </div>
              <div>
                <label
                  htmlFor="kontaktNotiz"
                  className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5"
                >
                  Notiz
                </label>
                <textarea
                  id="kontaktNotiz"
                  value={notiz}
                  onChange={(e) => setNotiz(e.target.value)}
                  rows="2"
                  className="w-full px-2.5 py-1.5 border-light-border dark:border-dark-border rounded-md text-sm shadow-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:ring-light-accent-green dark:focus:ring-dark-accent-green focus:border-light-accent-green dark:focus:border-dark-accent-green"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary bg-light-border dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white dark:text-dark-bg bg-light-accent-green dark:bg-dark-accent-green hover:opacity-90 rounded-md shadow-sm"
                >
                  {editingKontaktId ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.keys(gefilterteUndGruppierteKontakte).length === 0 &&
        !loading &&
        !showForm &&
        userId && (
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-6 text-sm">
            {searchTerm || filterTyp !== "Alle"
              ? "Keine Kontakte für Filter."
              : "Keine Kontakte vorhanden."}
          </p>
        )}

      {userId && Object.keys(gefilterteUndGruppierteKontakte).length > 0 && (
        <div className="space-y-5">
          {sortOrderOfTypen.map((typGruppe) => {
            if (
              gefilterteUndGruppierteKontakte[typGruppe] &&
              gefilterteUndGruppierteKontakte[typGruppe].length > 0
            ) {
              return (
                <section key={typGruppe} className="mb-5">
                  <h3 className="text-md font-semibold text-light-text-main dark:text-dark-text-main mb-2 pb-1 border-b border-light-border dark:border-dark-border/50">
                    {typGruppe}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gefilterteUndGruppierteKontakte[typGruppe].map(
                      (kontakt) => {
                        const meta = getKontaktTypMetaInfo(kontakt.typ, theme); // Theme übergeben
                        const initials = getInitials(kontakt.name);
                        return (
                          <div
                            key={kontakt.id}
                            className="bg-light-card-bg dark:bg-dark-card-bg p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col space-y-1.5 group self-start border border-light-border dark:border-dark-border/50"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div
                                className={`w-10 h-10 rounded-full ${meta.avatarColor} flex items-center justify-center text-white text-md font-semibold`}
                              >
                                {initials}
                              </div>
                              <div>
                                <h4 className="text-md font-semibold text-light-text-main dark:text-dark-text-main">
                                  {kontakt.name}
                                </h4>
                                <p
                                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full inline-block ${meta.color}`}
                                >
                                  {kontakt.typ}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`tel:${kontakt.telefon}`}
                              className="text-light-accent-green dark:text-dark-accent-green hover:opacity-80 flex items-center text-xs group pt-0.5"
                            >
                              <Phone
                                size={14}
                                className="mr-1.5 text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-accent-green dark:group-hover:text-dark-accent-green"
                              />{" "}
                              <span>{kontakt.telefon}</span>
                            </a>
                            {kontakt.adresse && (
                              <a
                                href={generateMapLink(
                                  kontakt.adresse,
                                  selectedMapService
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-light-accent-blue dark:text-dark-accent-blue hover:opacity-80 flex items-center text-xs group pt-0.5"
                                title={`Adresse in ${
                                  selectedMapService === "google"
                                    ? "Google Maps"
                                    : selectedMapService === "apple"
                                    ? "Apple Maps"
                                    : "OpenStreetMap"
                                } öffnen`}
                              >
                                <MapPin
                                  size={14}
                                  className="mr-1.5 text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-accent-blue dark:group-hover:text-dark-accent-blue"
                                />
                                <span>{kontakt.adresse}</span>
                              </a>
                            )}
                            {kontakt.notiz && (
                              <div className="mt-1 pt-1 border-t border-light-border dark:border-dark-border/30">
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary whitespace-pre-wrap">
                                  {kontakt.notiz}
                                </p>
                              </div>
                            )}
                            <div className="flex justify-end space-x-0.5 pt-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(kontakt);
                                }}
                                disabled={!userId}
                                title="Bearbeiten"
                                className="p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-accent-green dark:hover:text-dark-accent-green rounded hover:bg-light-border dark:hover:bg-dark-border/50"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteKontakt(kontakt.id);
                                }}
                                disabled={!userId}
                                title="Löschen"
                                className="p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-danger-color rounded hover:bg-light-border dark:hover:bg-dark-border/50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default KontaktManager;
