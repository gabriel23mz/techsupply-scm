import Combobox from '../Combobox/Combobox';

function SelectField(props) {
  return (
    <Combobox
      searchable={false}
      {...props}
    />
  );
}

export default SelectField;
