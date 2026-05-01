import { PageShell } from '@/components/layout/PageShell';
import { WhatsAppConfigForm } from '@/components/whatsapp/WhatsAppConfigForm';

export default function WhatsAppConfigPage() {
    return (
        <PageShell
            title="Configuracion de WhatsApp"
            subtitle="Administra las credenciales por organizacion, el modo operativo del canal y la validacion del webhook."
        >
            <WhatsAppConfigForm />
        </PageShell>
    );
}

