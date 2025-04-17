import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {DecryptedPatient, Patient, PatientFilters} from "@icure/cardinal-sdk";
import {cardinalApi} from "./api";

export const patientApiRtk = createApi({
	reducerPath: 'patientApi',
	tagTypes: ['Patient'],
	baseQuery: fetchBaseQuery({
		baseUrl: '/rest/v2/patient',
	}),
	endpoints: builder => ({
		createOrUpdatePatient: builder.mutation<DecryptedPatient, DecryptedPatient>({
			async queryFn(patient, {getState}) {
				const api = await cardinalApi(getState)

				if (!api) {
					throw new Error('No api available')
				}

				const {patient: patientApi} = api
				const createdPatient = await patientApi.createPatient(await patientApi.withEncryptionMetadata(patient));
				return {data: createdPatient};
			},
			invalidatesTags: (patient) => [{type: 'Patient', id: patient!.id}],
		}),
		filterPatients: builder.query<Patient[], void>({
			async queryFn(_, {getState}) {
				const api = await cardinalApi(getState)

				if (!api) {
					throw new Error('No api available')
				}

				const {patient: patientApi} = api
				const paginatedList = await patientApi.encrypted.filterPatientsBy(PatientFilters.allPatientsForSelf());
				console.log('Got paginated list')

				const start = +new Date();

				let patients: Patient[] = [];

				while (await paginatedList.hasNext()) {
					patients.push(...(await paginatedList.next(100)))
					console.log('Got next page')
					const time = +new Date();
					console.log('Time to get next page', time - start)
				}
				const end = +new Date();
				console.log('Time to get all patients', end - start)
				console.log('Got all patients', patients.length)

				return {data: patients};
			},
		}),
	}),
});

export const {useCreateOrUpdatePatientMutation, useLazyFilterPatientsQuery} = patientApiRtk;
