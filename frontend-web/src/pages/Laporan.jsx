import { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, FileText, Leaf } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Laporan() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchReport = async () => {
      try {
        const response = await api.get('/reports');
        setReport(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal memuat laporan');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await api.get(`/reports/export?format=${format}`, {
        responseType: format === 'csv' ? 'text' : 'json',
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-${new Date().toISOString().split('T')[0]}.json`);
        link.click();
      }
    } catch (err) {
      setError('Gagal export laporan');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (!report) {
    return <div className="p-6 text-gray-600">Laporan tidak tersedia</div>;
  }

  const { summary, fields_by_status, top_farmers, category_distribution, monthly_trend } = report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
            <FileText className="h-7 w-7 shrink-0 text-green-600 sm:h-8 sm:w-8" />
            Laporan Program
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Diperbarui: {new Date(report.generated_at).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-4">
        <Card
          icon={Leaf}
          title="Total Lahan"
          value={summary.total_fields}
          subtitle={`${summary.verified_fields} terverifikasi (${summary.verification_rate}%)`}
          color="green"
        />
        <Card
          icon={TrendingUp}
          title="Total Foto"
          value={summary.total_photos}
          subtitle={`${summary.verified_photos} terverifikasi`}
          color="blue"
        />
        <Card
          icon={FileText}
          title="Total Klaim"
          value={summary.total_claims}
          subtitle={`${summary.approved_claims} disetujui (${summary.approval_rate}%)`}
          color="amber"
        />
        <Card
          icon={Users}
          title="Total Petani"
          value={summary.total_farmers}
          subtitle={`${summary.total_petani_users} pengguna terdaftar`}
          color="purple"
        />
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-2 gap-6">
        {/* Fields by Status */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Status Lahan</h2>
          <div className="space-y-3">
            {fields_by_status.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 capitalize">{item.status.replace(/_/g, ' ')}</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold text-sm">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Stok Kategori</h2>
          <div className="space-y-3">
            {category_distribution.map((item) => (
              <div key={item.category} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.total_distributed} disalurkan</span>
                </div>
                <div className="text-sm text-gray-600">
                  Sisa stok: <span className="font-semibold">{item.remaining_stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Farmers */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top 10 Petani</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 text-gray-600 font-semibold">#</th>
                <th className="text-left py-2 px-3 text-gray-600 font-semibold">Nama</th>
                <th className="text-left py-2 px-3 text-gray-600 font-semibold">Email</th>
                <th className="text-center py-2 px-3 text-gray-600 font-semibold">Klaim Disetujui</th>
                <th className="text-center py-2 px-3 text-gray-600 font-semibold">Total Klaim</th>
              </tr>
            </thead>
            <tbody>
              {top_farmers.map((farmer, idx) => (
                <tr key={farmer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-600">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-gray-900">{farmer.nama}</td>
                  <td className="py-3 px-3 text-gray-600 text-xs">{farmer.email}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                      {farmer.approved_claims}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-600">{farmer.total_claims}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthly_trend.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tren Bulanan (12 Bulan Terakhir)</h2>
          <div className="space-y-3">
            {monthly_trend.slice(0, 12).map((item) => (
              <div key={`${item.month}-${item.type}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700">
                    {new Date(item.month).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2 capitalize">({item.type})</span>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`card p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs mt-2 opacity-75">{subtitle}</p>
        </div>
        <Icon className="w-10 h-10 opacity-20" />
      </div>
    </div>
  );
}
