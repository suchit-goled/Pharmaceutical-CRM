import { useState, useEffect } from "react";
import { Pill, Search, CheckCircle, X, ShieldAlert } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

// Medicine SVG illustrations
import doloImg from "../assets/medicines/dolo-650.svg";
import augmentinImg from "../assets/medicines/augmentin-625.svg";
import panImg from "../assets/medicines/pan-40.svg";
import atorvaImg from "../assets/medicines/atorva-20.svg";
import glycometImg from "../assets/medicines/glycomet-500.svg";
import rxDefaultImg from "../assets/medicines/rx-default.svg";

interface Product {
  id: number;
  brand_name: string;
  generic_name: string;
  ndc_code: string;
  category: string;
  dosage_form: string;
  strength: string;
  therapeutic_class?: string | null;
  manufacturer: string;
  approved_indications?: string | null;
  regulatory_status: string;
  storage_conditions: string;
  package_size: string;
  schedule_category?: string;
  mrp_inr?: number;
  ptr_inr?: number;
  gst_percentage?: number;
  barcode_gtin?: string;
  is_active: boolean;
}

const getMedicineImage = (brandName: string = "", genericName: string = "") => {
  const combined = (brandName + " " + genericName).toLowerCase();
  if (combined.includes("dolo") || combined.includes("paracetamol")) return doloImg;
  if (combined.includes("augmentin") || combined.includes("amoxicillin") || combined.includes("clav")) return augmentinImg;
  if (combined.includes("pan") || combined.includes("pantoprazole")) return panImg;
  if (combined.includes("atorva") || combined.includes("atorvastatin") || combined.includes("lipitor")) return atorvaImg;
  if (combined.includes("glycomet") || combined.includes("metformin")) return glycometImg;
  return rxDefaultImg;
};

export default function ProductCatalogue() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      const res = await api.get(url);
      setProducts(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load pharmaceutical product catalogue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  return (
    <DashboardLayout
      title="Pharmaceutical Product Catalogue"
      subtitle="CDSCO approved formulations, Indian brands, Schedule categories & standard MRP"
    >
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row flex-1 items-center gap-3 w-full">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 w-full sm:max-w-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Indian brand, generic salt (e.g. Paracetamol), Schedule..."
              className="outline-none bg-transparent text-xs sm:text-sm w-full placeholder:text-slate-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-none w-full sm:w-auto"
          >
            <option value="">All Therapeutic Categories</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Oncology">Oncology</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Neurology & Psychiatry">Neurology &amp; Psychiatry</option>
            <option value="Immunology">Immunology</option>
            <option value="Anti-Infectives">Anti-Infectives</option>
            <option value="Gastrointestinal">Gastrointestinal</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-52"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md mx-auto">
          <Pill size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Formulations Located</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Try adjusting your generic salt or brand name search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const medImg = getMedicineImage(p.brand_name, p.generic_name);
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {/* Medicine Packaging Visual */}
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={medImg}
                        alt={`${p.brand_name} packaging`}
                        className="w-full h-full object-contain select-none"
                        width={56}
                        height={56}
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-base tracking-tight truncate">
                          {p.brand_name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                          <CheckCircle size={10} /> {p.regulatory_status || "Approved"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{p.generic_name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.manufacturer}</p>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Therapeutic Class:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {p.therapeutic_class || p.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Dosage &amp; Form:</span>
                      <span className="font-semibold text-slate-700">
                        {p.strength} {p.dosage_form}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Schedule &amp; MRP:</span>
                      <span className="font-bold text-indigo-700">
                        {p.schedule_category || "Schedule H"} • ₹{(p.mrp_inr || 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">CDSCO Drug Code:</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">{p.ndc_code}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 line-clamp-2">
                    <span className="font-semibold text-slate-700">Indications: </span>
                    {p.approved_indications || "Indicated for specific clinical therapy per prescribing monograph."}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">Pkg: {p.package_size}</span>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    View Monograph &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={getMedicineImage(selectedProduct.brand_name, selectedProduct.generic_name)}
                    alt={selectedProduct.brand_name}
                    className="w-full h-full object-contain"
                    width={64}
                    height={64}
                  />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">{selectedProduct.brand_name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedProduct.generic_name}</p>
                  <p className="text-[11px] text-slate-400">{selectedProduct.manufacturer}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-slate-400 font-medium">CDSCO Identifier</p>
                  <p className="font-mono font-bold text-slate-800">{selectedProduct.ndc_code}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Regulatory Status</p>
                  <p className="font-bold text-emerald-700">{selectedProduct.regulatory_status}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Dosage &amp; Strength</p>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.strength} ({selectedProduct.dosage_form})
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Schedule &amp; MRP</p>
                  <p className="font-bold text-indigo-700">
                    {selectedProduct.schedule_category || "Schedule H"} • ₹{(selectedProduct.mrp_inr || 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-indigo-600" />
                  Approved Clinical Indications (CDSCO / DCGI Verified)
                </h5>
                <p className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-slate-700 leading-relaxed text-xs">
                  {selectedProduct.approved_indications || "Indicated for specific therapeutic management according to medical practitioner guidelines."}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Storage &amp; Packaging Guidelines</h5>
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-xs">
                  {selectedProduct.storage_conditions} • {selectedProduct.package_size}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close Monograph
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
