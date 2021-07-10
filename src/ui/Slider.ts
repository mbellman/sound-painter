import Widget, { WidgetElement } from './Widget';
import { clamp, isDecimal, lerp, sort } from '../utilities';
import './Slider.scss';

/**
 * @internal
 */
interface Position {
  x: number;
  y: number;
}

/**
 * @internal
 */
interface SliderOptions {
  label: string;
  length: () => number;
  orientation: 'horizontal' | 'vertical';
  position: () => Position;
  range: [number, number];
  default: number | number[];
};

export default class Slider extends Widget<SliderOptions> {
  private $handles: WidgetElement[];
  private $bar: WidgetElement;
  private values: number[];

  public getValue(): number {
    return this.values[0];
  }

  public getValues(): number[] {
    return this.values;
  }

  protected initialize(): void {
    this.$bar = this.$('.slider--bar');
    this.$handles = this.$$('.slider--handle');
    this.values = Array.isArray(this.options.default) ? this.options.default : [ this.options.default ];

    const isDecimalSlider = isDecimal(this.options.range[0]) || isDecimal(this.options.range[1]);
    const normalizeValue = value => isDecimalSlider ? value : Math.round(value);

    this.updateDimensions();
    this.updateHandlePositions();
    this.updateBarColor();

    window.addEventListener('resize', () => this.updateDimensions());

    this.$handles.forEach(($handle, index) => {
      this.draggable($handle, e => {
        if (this.isVertical()) {
          const y = e.clientY;
          const clampedY = clamp(y, this.getBarTop(), this.getBarTop() + this.getBarHeight());
          const ratio = (clampedY - this.getBarTop()) / this.getBarHeight();
 
          this.values[index] = normalizeValue(lerp(this.options.range[1], this.options.range[0], ratio));

          $handle.css('top', `${ratio * 100}%`);
        } else {
          const x = e.clientX;
          const clampedX = clamp(x, this.getBarLeft(), this.getBarLeft() + this.getBarWidth());
          const ratio = (clampedX - this.getBarLeft()) / this.getBarWidth();
  
          this.values[index] = normalizeValue(lerp(this.options.range[0], this.options.range[1], ratio));

          $handle.css('left', `${ratio * 100}%`);
        }

        this.updateBarColor();
      });
    });
  }

  protected template(): string {
    return `
      <div class="slider ${this.options.orientation}">
        <div class="slider--label">
          ${this.options.label}
        </div>
        <div class="slider--bar">
          ${Array.isArray(this.options.default)
            ? this.options.default.map(() => '<div class="slider--handle"></div>').join('')
            : '<div class="slider--handle"></div>'
          }
        </div>
      </div>
    `;
  }

  private getBarHeight(): number {
    return parseInt(window.getComputedStyle(this.$bar).height);
  }

  private getBarLeft(): number {
    return this.$bar.getBoundingClientRect().left;
  }

  private getBarTop(): number {
    return this.$bar.getBoundingClientRect().top;
  }

  private getBarWidth(): number {
    return this.$bar.getBoundingClientRect().width;
  }

  private isVertical(): boolean {
    return this.options.orientation === 'vertical';
  }

  private valueRatio(value: number): number {
    const { range } = this.options;

    return (value - range[0]) / (range[1] - range[0]);
  }

  private updateBarColor(): void {
    if (this.values.length > 1) {
      const stops = sort(this.values)
        .reverse()
        .map(value => 100 - Math.round(this.valueRatio(value) * 100))
        .map((percent, index, percentages) => {
          const nextPercent = percentages[index + 1] || 100;
          const nextMidStop = (percent + nextPercent) / 2;

          return `#05a ${percent}%, #012 ${nextMidStop}%`;
        })
        .join(', ');

      const direction = this.isVertical() ? 'to bottom' : 'to left';

      this.$bar.css('background', `linear-gradient(${direction}, #012 0%, ${stops})`);
    } else {
      const valuePercent = Math.round(this.valueRatio(this.values[0]) * 100);

      this.$bar.css('background', `linear-gradient(to right, #05a 0%, #05a ${valuePercent}%, #333 ${valuePercent + 1}%, #333 100%)`);
    }
  }

  private updateDimensions(): void {
    const position = this.options.position();
    const length = this.options.length();
    const lengthProperty = this.isVertical() ? 'height' : 'width';

    this.element.css('top', `${position.y}px`);
    this.element.css('left', `${position.x}px`);
    this.element.css(lengthProperty, `${length}px`);
  }

  private updateHandlePositions(): void {
    this.values.forEach((value, index) => {
      const offsetProperty = this.isVertical() ? 'top' : 'left';
      const percentage = this.valueRatio(value) * 100;
      const offset = this.isVertical() ? 100 - percentage : percentage;

      this.$handles[index].css(offsetProperty, `${offset}%`);
    });
  }
}