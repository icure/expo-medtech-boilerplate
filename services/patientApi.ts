import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {Patient} from '@icure/medical-device-sdk';
import {guard, medTechApi} from './api';

export const patientApiRtk = createApi({
  reducerPath: 'patientApi',
  tagTypes: ['Patient'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/rest/v2/patient',
  }),
  endpoints: builder => ({
    createOrUpdatePatient: builder.mutation<Patient, Patient>({
      async queryFn(patient, {getState}) {
        const api = await medTechApi(getState)

        if (!api) {
          throw new Error('No medTechApi available')
        }

        const {patientApi} = api
        return guard([patientApi], () => {
          const createdPatient =  patientApi.createOrModifyPatient(patient);
          console.log('createdPatient', createdPatient);
          return createdPatient;
        });
      },
      invalidatesTags: (patient) => [{type: 'Patient', id: patient!.id}],
    }),
  }),
});

export const {useCreateOrUpdatePatientMutation} = patientApiRtk;
