import Button from './Button';

interface ContainerProps {
  heading: string;
  description: string;
  actionButtonLabel: string;
  actionButtonVariant?: 'danger' | 'primary' | 'success';
  handleActionButton: () => void;
  handleCancelButton: () => void;
}

function DialogBox(props: ContainerProps) {
  // Get button styles based on variant

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full border shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">
          {props.heading}
        </h3>
        <p className="mb-6">
          {props.description}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            type='button'
            variant='outline'
            onClick={props.handleCancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={props.handleActionButton}
          >
            {props.actionButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DialogBox;