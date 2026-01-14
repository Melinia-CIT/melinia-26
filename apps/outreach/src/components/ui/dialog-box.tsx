import Button from './button';

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
      <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">
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