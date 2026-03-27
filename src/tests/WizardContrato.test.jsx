import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WizardContrato from '../components/WizardContrato';

// Mock de Supabase y PropiedadesService
vi.mock('../supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'agente-123' } } })),
        }
    }
}));

vi.mock('../propiedadesService', () => ({
    propiedadesService: {
        verificar_suscripcion_agente: vi.fn(() => Promise.resolve({ status: 'activo' })),
    }
}));

describe('WizardContrato - Suite TDD de Validación Legal', () => {

    it('PROHIBIDO: No debe habilitar el botón si la dirección es demasiado corta (No exacta)', async () => {
        const mock_on_success = vi.fn();
        const propiedad = { id: 1, zona: 'Barinas', agente_id: 'agente-123' };

        render(
            <WizardContrato 
                propiedad={propiedad} 
                prospecto={{ id: '123' }} 
                on_close={() => {}} 
                on_success={mock_on_success} 
            />
        );

        // Esperamos a que termine la validación de seguridad (cargando_validacion: false)
        await waitFor(() => expect(screen.queryByText(/Escaneando Status/i)).not.toBeInTheDocument());

        const input_direccion = screen.getByPlaceholderText(/Conjunto Res. Gardenias/i);
        const boton_generar = screen.getByRole('button', { name: /Generar Documentos/i });

        // Caso 1: Dirección muy corta (violación regla dirección exacta)
        fireEvent.change(input_direccion, { target: { value: 'Calle 1' } });
        expect(boton_generar).toBeDisabled();
    });

    it('PROHIBIDO: Bloquea generación si faltan datos del abogado', async () => {
        render(
            <WizardContrato 
                propiedad={{ id: 1 }} 
                prospecto={{ id: '123' }} 
                on_close={() => {}} 
                on_success={() => {}} 
            />
        );
        await waitFor(() => expect(screen.queryByText(/Escaneando Status/i)).not.toBeInTheDocument());

        const input_abogado = screen.getByPlaceholderText(/Nombre completo/i);
        const boton_generar = screen.getByRole('button', { name: /Generar Documentos/i });

        fireEvent.change(input_abogado, { target: { value: '' } });
        expect(boton_generar).toBeDisabled();
    });

    it('EXITO: Habilita generación con dirección detallada y abogado válido', async () => {
        render(
            <WizardContrato 
                propiedad={{ id: 1, zona: 'Barinas' }} 
                prospecto={{ id: '123' }} 
                on_close={() => {}} 
                on_success={() => {}} 
            />
        );
        await waitFor(() => expect(screen.queryByText(/Escaneando Status/i)).not.toBeInTheDocument());

        const input_direccion = screen.getByPlaceholderText(/Conjunto Res. Gardenias/i);
        const input_abogado = screen.getByPlaceholderText(/Nombre completo/i);
        const boton_generar = screen.getByRole('button', { name: /Generar Documentos/i });

        // Llenamos con datos que pasen el 'ejecutar_test_validez'
        fireEvent.change(input_abogado, { target: { value: 'Moraima Laya' } });
        fireEvent.change(input_direccion, { target: { value: 'Av. Agustín Codazzi, Edificio B, Piso 4, Oficina 4-2' } });

        expect(boton_generar).not.toBeDisabled();
    });
});

