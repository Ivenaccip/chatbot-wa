import path from 'path';
import { google } from 'googleapis';
import { request } from 'http';

const sheets = google.sheets('v4');

// Vamos a hacer dos procesos (insersión y revisión de datos)
async function addRowToSheet(auth, spreadsheetId, values) {
    const request = {
        spreadsheetId, 
        range: 'reservas',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource:{
            values: [values],
        },
        auth,
    }

    try {
        const response = (await sheets.spreadsheets.values.append(request).data)
        return response;
    } catch (error) {
        console.error(error)
    }
}

const appendToSheet = async (data) => {
    try {
        // Estamos indicando donde están las credenciales
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'src/credentials','credentials.json'),
            // scopes, hacía donde te quieres comunicar
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        // Espera a la acción
        const authClient = await auth.getClient();
        // Donde esta el archivo que queremos modificar (entre /d/ ... /edit...)
        const spreadsheetId = '12uhrVjJlClclqGo5XmsGPZu7bz9DxNvhk4v4xNAdhT8';

        await addRowToSheet(authClient, spreadsheetId, data);
        return 'Datos correctamente agregados'

    } catch (error) {
        console.error(error);
    }
}

export default appendToSheet;