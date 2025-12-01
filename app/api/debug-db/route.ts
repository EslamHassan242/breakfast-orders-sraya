import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    const results = {
        roomCreation: null as any,
        menuInsertion: null as any,
        orderInsertion: null as any,
        errors: [] as string[]
    };

    const testRoomId = 'debug-' + Date.now();

    // 1. Test Room Creation
    try {
        const { data, error } = await supabase
            .from('rooms')
            .insert([{ id: testRoomId, name: 'Debug Room' }])
            .select();

        if (error) {
            results.roomCreation = { success: false, error };
            results.errors.push(`Room Creation Error: ${error.message} (${error.code})`);
        } else {
            results.roomCreation = { success: true, data };
        }
    } catch (e: any) {
        results.roomCreation = { success: false, error: e.message };
        results.errors.push(`Room Creation Exception: ${e.message}`);
    }

    // 2. Test Menu Insertion (only if room creation didn't fail hard, but we try anyway)
    try {
        const { data, error } = await supabase
            .from('menu')
            .insert([{ name: 'Debug Item', price: 10, room_id: testRoomId }])
            .select();

        if (error) {
            results.menuInsertion = { success: false, error };
            results.errors.push(`Menu Insertion Error: ${error.message} (${error.code})`);
        } else {
            results.menuInsertion = { success: true, data };
        }
    } catch (e: any) {
        results.menuInsertion = { success: false, error: e.message };
        results.errors.push(`Menu Insertion Exception: ${e.message}`);
    }

    // 3. Test Order Insertion
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                customer: 'Debug User',
                items: [],
                total: 0,
                room_id: testRoomId,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            results.orderInsertion = { success: false, error };
            results.errors.push(`Order Insertion Error: ${error.message} (${error.code})`);
        } else {
            results.orderInsertion = { success: true, data };
        }
    } catch (e: any) {
        results.orderInsertion = { success: false, error: e.message };
        results.errors.push(`Order Insertion Exception: ${e.message}`);
    }

    // Cleanup (optional, but good practice if it worked)
    if (results.roomCreation?.success) {
        await supabase.from('rooms').delete().eq('id', testRoomId);
    }

    return NextResponse.json(results);
}
