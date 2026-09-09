// ─────────────────────────────────────────────────────────────────────────────
// Module Admin — "Base de données" (référentiels)
// 4 onglets : Sites · Zones · Intervenants externes · Utilisateurs
// Accès réservé à ADMIN/HSE_MANAGER (filtré en amont par la route —
// voir App.tsx / ProtectedRoute). Chaque onglet applique en plus ses
// propres restrictions d'écriture, alignées sur les policies RLS de
// la migration 004_referentiels.sql.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Database, Building2, MapPinned, HardHat, UserCog } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { useAuth } from '@/contexts/AuthContext';
import { SitesTab } from './SitesTab';
import { ZonesTab } from './ZonesTab';
import { IntervenantsTab } from './IntervenantsTab';
import { UtilisateursTab } from './UtilisateursTab';

type Onglet = 'sites' | 'zones' | 'intervenants' | 'utilisateurs';

export function DashboardAdmin() {
  const [onglet, setOnglet] = useState<Onglet>('sites');
  const { profile } = useAuth();

  return (
    <div className="min-h-screen">
      <ModuleHeader
        icon={Database}
        title="Base de données"
        subtitle="Référentiels · Sites, zones, intervenants, utilisateurs"
        tabs={[
          { id: 'sites',        label: 'Sites',                  icon: <Building2 size={14} /> },
          { id: 'zones',        label: 'Zones',                  icon: <MapPinned size={14} /> },
          { id: 'intervenants', label: 'Intervenants externes',  icon: <HardHat size={14} /> },
          { id: 'utilisateurs', label: 'Utilisateurs',           icon: <UserCog size={14} /> },
        ]}
        activeTab={onglet}
        onTabChange={id => setOnglet(id as Onglet)}
      />

      <main className="max-w-6xl mx-auto px-6 py-6">
        {!profile ? null : (
          <>
            {onglet === 'sites'        && <SitesTab profile={profile} />}
            {onglet === 'zones'        && <ZonesTab profile={profile} />}
            {onglet === 'intervenants' && <IntervenantsTab profile={profile} />}
            {onglet === 'utilisateurs' && <UtilisateursTab profile={profile} />}
          </>
        )}
      </main>
    </div>
  );
}
