import { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, FileText, Leaf, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const statusBadgeMap = {
  terverifikasi: 'badge-success',
  menunggu_verifikasi: 'badge-warning',
  ditolak: 'badge-danger',
  belum_ada_foto: 'badge-info',
};

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
          <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Memuat laporan program...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card p-8 text-center text-muted-foreground text-sm">
        Laporan tidak tersedia
      </div>
    );
  }

  const { summary, fields_by_status, top_farmers, category_distribution, monthly_trend } = report;

  return (
    <div className="space-y-6">
      {/* PageHeader seragam */}
      <PageHeader
        eyebrow="LAPORAN PROGRAM"
        title="Laporan Program"
        subtitle={`Diperbarui: ${new Date(report.generated_at).toLocaleString('id-ID')}`}
        action={
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={Leaf}
          title="Total Lahan"
          value={summary.total_fields}
          subtitle={`${summary.verified_fields} terverifikasi (${summary.verification_rate}%)`}
          iconTone="bg-primary/10 text-primary"
        />
        <SummaryCard
          icon={TrendingUp}
          title="Total Foto"
          value={summary.total_photos}
          subtitle={`${summary.verified_photos} terverifikasi`}
          iconTone="bg-forest/10 text-forest"
        />
        <SummaryCard
          icon={FileText}
          title="Total Klaim"
          value={summary.total_claims}
          subtitle={`${summary.approved_claims} disetujui (${summary.approval_rate}%)`}
          iconTone="bg-ember/10 text-ember"
        />
        <SummaryCard
          icon={Users}
          title="Total Petani"
          value={summary.total_farmers}
          subtitle={`${summary.total_petani_users} pengguna terdaftar`}
          iconTone="bg-primary/10 text-primary"
        />
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-2 gap-6">
        {/* Fields by Status */}
        <div className="card p-5 lg:p-6 animate-fade-up">
          <h2 className="font-display text-base lg:text-lg font-bold text-foreground mb-4">Status Lahan</h2>
          <div className="space-y-2.5">
            {fields_by_status.map((item) => {
              const badgeClass = statusBadgeMap[item.status] || 'badge-info';
              return (
                <div key={item.status} className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/60">
                  <span className="font-medium text-foreground capitalize text-sm">{item.status.replace(/_/g, ' ')}</span>
                  <span className={`badge ${badgeClass}`}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card p-5 lg:p-6 animate-fade-up">
          <h2 className="font-display text-base lg:text-lg font-bold text-foreground mb-4">Stok Kategori</h2>
          <div className="space-y-2.5">
            {category_distribution.map((item) => (
              <div key={item.category} className="p-3.5 bg-muted/40 rounded-xl border border-border/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-foreground text-sm">{item.category}</span>
                  <span className="text-xs text-muted-foreground">{item.total_distributed} disalurkan</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Sisa stok: <span className="font-semibold text-foreground">{item.remaining_stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Farmers */}
      <div className="card p-5 lg:p-6 animate-fade-up">
        <h2 className="font-display text-base lg:text-lg font-bold text-foreground mb-4">Top 10 Petani</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Nama</th>
                <th className="table-header">Email</th>
                <th className="table-header text-center">Klaim Disetujui</th>
                <th className="table-header text-center">Total Klaim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card">
              {top_farmers.map((farmer, idx) => (
                <tr key={farmer.id} className="hover:bg-muted/30 transition-colors">
                  <td className="table-cell text-muted-foreground">{idx + 1}</td>
                  <td className="table-cell font-semibold text-foreground">{farmer.nama}</td>
                  <td className="table-cell text-muted-foreground text-xs">{farmer.email}</td>
                  <td className="table-cell text-center">
                    <span className="badge badge-success">
                      {farmer.approved_claims}
                    </span>
                  </td>
                  <td className="table-cell text-center text-muted-foreground font-medium">{farmer.total_claims}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthly_trend.length > 0 && (
        <div className="card p-5 lg:p-6 animate-fade-up">
          <h2 className="font-display text-base lg:text-lg font-bold text-foreground mb-4">Tren Bulanan (12 Bulan Terakhir)</h2>
          <div className="space-y-2.5">
            {monthly_trend.slice(0, 12).map((item) => (
              <div key={`${item.month}-${item.type}`} className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/60">
                <div>
                  <span className="font-medium text-foreground text-sm">
                    {new Date(item.month).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize">({item.type})</span>
                </div>
                <span className="badge badge-info">
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

function SummaryCard({ icon: Icon, title, value, subtitle, iconTone }) {
  return (
    <div className="card card-hover p-5 lg:p-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div className={`icon-tile w-11 h-11 shrink-0 ${iconTone}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 font-display text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>}
    </div>
  );
}
