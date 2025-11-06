// React / RN
import { StyleSheet, View, Image } from 'react-native';
import React, { useState } from 'react';

// Form & validación
import * as Yup from 'yup';
import { useFormik } from 'formik';

// UI
import { Button, Appbar, useTheme, Text } from 'react-native-paper';
import Images from '../../../assets/images';
import { Input } from '../../uiKit';

// Estado global y select
import { useDispatch } from 'react-redux';
import DropDownPicker from 'react-native-dropdown-picker';

// Navegación + API + Redux slice
import useAddItem from '../hooks/useAddItem';
import { insertItem } from '../../api';
import { addItem } from '../../items/slices/item';

/**
 * Componente de formulario para crear un nuevo Item.
 * - Muestra inputs controlados por Formik.
 * - Valida con Yup.
 * - Convierte cm → m para ancho/largo/alto.
 * - Envia el payload a la API (POST /items).
 * - Actualiza Redux y navega a la lista si todo sale bien.
 */
const ItemDimensionPlanning = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Estado del dropdown (selector de "tipo")
  const [open, setOpen] = useState(false);   // abre/cierra el menú
  const [value, setValue] = useState(null);  // valor seleccionado

  // Hook propio: entrega helpers de navegación y la lista de opciones del dropdown
  // items: [{ label: 'Perecedero', value: 'Perecedero' }, ...]
  const { goBack, goItems, items } = useAddItem();

  // Esquema de validación (campos que exige la tabla "items")
  const schema = Yup.object().shape({
    nombre:   Yup.string().required('El nombre es requerido'),
    tipo:     Yup.string().required('El tipo es requerido'),
    anchoCm:  Yup.number().typeError('Debe ser numérico').positive().required('El ancho es requerido'),
    largoCm:  Yup.number().typeError('Debe ser numérico').positive().required('El largo es requerido'),
    altoCm:   Yup.number().typeError('Debe ser numérico').positive().required('El alto es requerido'),
    peso:     Yup.number().typeError('Debe ser numérico').min(0, 'No negativo').required('El peso es requerido'),
    cantidad: Yup.number().typeError('Debe ser numérico').integer('Debe ser entero').min(1).required('La cantidad es requerida'),
    bodega_id:Yup.number().typeError('Debe ser numérico').integer('Debe ser entero').min(1).required('La bodega es requerida'),
  });

  // Sincroniza el valor del dropdown con Formik (values.tipo)
  const onChangeValue = (val) => {
    setValue(val);
    values.tipo = val; // asigna directamente al form
  };

  // Inicialización de Formik
  const formik = useFormik({
    // Valores del formulario (los de dimensiones se capturan en cm para la UI)
    initialValues: {
      nombre: '',
      tipo: '',
      anchoCm: '',
      largoCm: '',
      altoCm: '',
      peso: '',
      cantidad: '',
      bodega_id: '',
    },
    validationSchema: schema,

    // Submit del formulario
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Conversión: la BD guarda en metros. La UI captura en centímetros.
        const payload = {
          nombre: values.nombre,
          tipo: values.tipo,
          ancho: Number(values.anchoCm) / 100,
          largo: Number(values.largoCm) / 100,
          alto:  Number(values.altoCm)  / 100,
          peso: Number(values.peso),
          cantidad: Number(values.cantidad),
          bodega_id: Number(values.bodega_id),
        };

        // Llamada a la API (POST /items) → debe devolver { insertId }
        const { error, body } = await insertItem(payload);
        if (!error) {
          // Refleja en Redux el nuevo item (optimistic update)
          dispatch(addItem({ id: body.insertId, ...payload }));
          // Vuelve a la lista de items
          goItems();
        }
      } catch (e) {
        console.log('Error insertando item', e);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Atajos de Formik
  const {
    errors, touched, values,
    handleSubmit, handleBlur, handleChange, isSubmitting,
  } = formik;

  // Habilita el botón "Guardar" solo si todos los campos están completados
  const disabled =
    !values.nombre ||
    !values.tipo ||
    !values.anchoCm ||
    !values.largoCm ||
    !values.altoCm ||
    !values.peso ||
    !values.cantidad ||
    !values.bodega_id;

  return (
    <>
      {/* Barra superior con retroceso */}
      <Appbar.Header>
        <Appbar.BackAction onPress={goBack} />
        <Appbar.Content title="Nuevo ítem" />
      </Appbar.Header>

      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View>
          {/* Ilustración + título */}
          <Image source={Images.productInfo} style={{ height: 120, width: '100%', resizeMode: 'contain' }} />
          <Text variant="titleMedium" style={styles.text}>Ingresa los datos del nuevo ítem</Text>

          {/* Selector de tipo */}
          <DropDownPicker
            open={open}
            value={value}
            items={items}              // opciones del hook useAddItem
            setOpen={setOpen}
            setValue={onChangeValue}   // actualiza "tipo" en el form
            placeholder="Selecciona el tipo"
            zIndex={1000}
          />

          {/* Nombre */}
          <Input
            label="Nombre"
            value={values.nombre}
            handleChange={handleChange('nombre')}
            handleBlur={handleBlur('nombre')}
            errorMessage={touched.nombre && errors.nombre}
          />

          {/* Dimensiones en cm (la conversión se hace al enviar) */}
          <Input
            label="Ancho (cm)"
            value={values.anchoCm}
            handleChange={handleChange('anchoCm')}
            handleBlur={handleBlur('anchoCm')}
            keyboardType="number-pad"
            errorMessage={touched.anchoCm && errors.anchoCm}
          />
          <Input
            label="Largo (cm)"
            value={values.largoCm}
            handleChange={handleChange('largoCm')}
            handleBlur={handleBlur('largoCm')}
            keyboardType="number-pad"
            errorMessage={touched.largoCm && errors.largoCm}
          />
          <Input
            label="Alto (cm)"
            value={values.altoCm}
            handleChange={handleChange('altoCm')}
            handleBlur={handleBlur('altoCm')}
            keyboardType="number-pad"
            errorMessage={touched.altoCm && errors.altoCm}
          />

          {/* Campos adicionales requeridos por la tabla */}
          <Input
            label="Peso (kg)"
            value={values.peso}
            handleChange={handleChange('peso')}
            handleBlur={handleBlur('peso')}
            keyboardType="decimal-pad"
            errorMessage={touched.peso && errors.peso}
          />
          <Input
            label="Cantidad"
            value={values.cantidad}
            handleChange={handleChange('cantidad')}
            handleBlur={handleBlur('cantidad')}
            keyboardType="number-pad"
            errorMessage={touched.cantidad && errors.cantidad}
          />
          <Input
            label="Bodega ID"
            value={values.bodega_id}
            handleChange={handleChange('bodega_id')}
            handleBlur={handleBlur('bodega_id')}
            keyboardType="number-pad"
            errorMessage={touched.bodega_id && errors.bodega_id}
          />
        </View>

        {/* Envío del formulario */}
        <Button mode="contained" loading={isSubmitting} onPress={handleSubmit} disabled={disabled}>
          Guardar
        </Button>
      </View>
    </>
  );
};

export default ItemDimensionPlanning;

/* Estilos base */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  text: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
});
