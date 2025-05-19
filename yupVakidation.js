const nameValidation = Yup.string().nullable();

const oneOfNamesRequired = (schema) => schema.test(
  'one-of-names',
  'Either First Name or Last Name is required',
  function () {
    const { frstName, lstName } = this.parent;
    return !!frstName || !!lstName;
  }
);

const addValidationSchema = () =>
  Yup.object().shape({
    frstName: nameValidation.when('search_by', {
      is: 'orgName',
      then: oneOfNamesRequired,
      otherwise: (schema) => schema.notRequired(),
    }),
    lstName: nameValidation.when('search_by', {
      is: 'orgName',
      then: oneOfNamesRequired,
      otherwise: (schema) => schema.notRequired(),
    }),
  });