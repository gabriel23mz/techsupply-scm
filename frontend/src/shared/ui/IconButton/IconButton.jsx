import {
  forwardRef,
} from 'react';

import Button from '../Button/Button';

const IconButton = forwardRef(function IconButton(
  {
    label,
    title,
    ...props
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      aria-label={label}
      title={title ?? label}
      {...props}
    />
  );
});

export default IconButton;
