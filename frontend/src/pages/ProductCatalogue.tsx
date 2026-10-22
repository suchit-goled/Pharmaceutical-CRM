import { useState, useEffect } from "react";
import { Pill, Search, CheckCircle, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

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
  is_active: boolean;
}

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
      subtitle="FDA/EMA approved indications, therapeutic classes, dosage specifications & storage"
    >
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand name, generic name, NDC..."
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Oncology">Oncology</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Neurology & Psychiatry">Neurology & Psychiatry</option>
            <option value="Immunology">Immunology</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-48"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Pill size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Products Found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">{p.brand_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{p.generic_name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle size={12} /> {p.regulatory_status}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Therapeutic Class:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                      {p.therapeutic_class || p.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dosage Form & Strength:</span>
                    <span className="font-semibold text-slate-700">
                      {p.strength} {p.dosage_form}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NDC Code:</span>
                    <span className="font-mono font-medium text-slate-800">{p.ndc_code}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-700">Approved Indications: </span>
                  {p.approved_indications || "Indicated for specific therapeutic management."}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] text-slate-400">Pkg: {p.package_size}</span>
                <span className="text-indigo-600 font-semibold hover:underline">View Indications &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.brand_name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedProduct.generic_name}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-slate-400 font-medium">NDC Identifier</p>
                  <p className="font-mono font-bold text-slate-800">{selectedProduct.ndc_code}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Regulatory Status</p>
                  <p className="font-bold text-emerald-700">{selectedProduct.regulatory_status}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Dosage & Strength</p>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.strength} ({selectedProduct.dosage_form})
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Therapeutic Category</p>
                  <p className="font-semibold text-indigo-700">{selectedProduct.category}</p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Approved Clinical Indications (FDA/EMA Verified)</h5>
                <p className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-700 leading-relaxed">
                  {selectedProduct.approved_indications}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Storage & Packaging Guidelines</h5>
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                  {selectedProduct.storage_conditions} • {selectedProduct.package_size}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
