import StartNode from './StartNode';
import EndNode from './EndNode';
import YesNoNode from './YesNoNode';
import MultipleChoiceNode from './MultipleChoiceNode';
import TextInputNode from './TextInputNode';
import DateNode from './DateNode';
import FormNode from './FormNode';
import InfoNode from './InfoNode';
import SuccessNode from './SuccessNode';
import SubflowNode from './SubflowNode';

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  'yes-no': YesNoNode,
  'multiple-choice': MultipleChoiceNode,
  text: TextInputNode,
  date: DateNode,
  form: FormNode,
  info: InfoNode,
  success: SuccessNode,
  subflow: SubflowNode,
};

export {
  StartNode,
  EndNode,
  YesNoNode,
  MultipleChoiceNode,
  TextInputNode,
  DateNode,
  FormNode,
  InfoNode,
  SuccessNode,
  SubflowNode,
};
