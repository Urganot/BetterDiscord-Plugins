import { React, classNames } from "./modules";
import { Flex, Button, FormSection, FormDivider, margins } from "./components";
import { confirm } from "./utils";

export interface SettingsContainerProps {
    name: string;
    children?: React.ReactNode;
    onReset?: () => void;
}

export const SettingsContainer = ({ name, children, onReset }: SettingsContainerProps): React.JSX.Element => (
    <FormSection>
        {children}
        {onReset ? (
            <>
                <FormDivider className={classNames(margins.marginTop20, margins.marginBottom20)} />
                <Flex justify={Flex.Justify.END}>
                    <Button
                        size={Button.Sizes.SMALL}
                        onClick={() =>
                            confirm(name, "Reset all settings?", {
                                onConfirm: () => onReset(),
                            })
                        }
                    >
                        Reset
                    </Button>
                </Flex>
            </>
        ) : null}
    </FormSection>
);
